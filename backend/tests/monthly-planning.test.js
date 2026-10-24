
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
    createMonthlyPlan
} from '../src/modules/monthly-planning.js';

test('creates a monthly plan using financial capacity and goal priorities', () => {
    const plan = createMonthlyPlan({
        financialProfile: {
            monthlyIncome: 50000,
            essentialExpenses: 20000,
            mandatoryDebtPayments: 5000,
            currentEmergencyReserve: 10000,
            emergencyReserveTarget: 15000
        },
        goals: [
            {
                id: 'education',
                targetAmount: 60000,
                currentSavings: 20000,
                monthsRemaining: 10,
                priority: 1
            },
            {
                id: 'home',
                targetAmount: 100000,
                currentSavings: 20000,
                monthsRemaining: 20,
                priority: 2
            }
        ]
    });

    assert.equal(plan.capacity.monthlySurplus, 25000);
    assert.equal(plan.capacity.emergencyReserveContribution, 5000);
    assert.equal(plan.capacity.availableForGoals, 20000);

    assert.equal(plan.feasibility.length, 2);
    assert.equal(plan.allocation.requiresDecision, false);

    assert.equal(
        plan.allocation.allocations[0].goalId,
        'education'
    );

    assert.equal(
        plan.allocation.allocations[0].allocatedContribution,
        4000
    );

    assert.equal(
    plan.allocation.allocations[1].allocatedContribution,
    4000
);

assert.equal(
    plan.allocation.unallocatedAmount,
    12000
);
});

test('does not allocate money to goals when there is a monthly deficit', () => {
    const plan = createMonthlyPlan({
        financialProfile: {
            monthlyIncome: 20000,
            essentialExpenses: 22000,
            mandatoryDebtPayments: 3000,
            currentEmergencyReserve: 10000,
            emergencyReserveTarget: 15000
        },
        goals: [
            {
                id: 'education',
                targetAmount: 50000,
                currentSavings: 10000,
                monthsRemaining: 10,
                priority: 1
            }
        ]
    });

    assert.equal(plan.capacity.hasMonthlyDeficit, true);
    assert.equal(plan.capacity.availableForGoals, 0);
    assert.equal(plan.allocation.allocations.length, 0);
});


test('requests a decision when equal-priority goals cannot both be funded', () => {
    const plan = createMonthlyPlan({
        financialProfile: {
            monthlyIncome: 25000,
            essentialExpenses: 20000,
            mandatoryDebtPayments: 0,
            currentEmergencyReserve: 10000,
            emergencyReserveTarget: 10000
        },
        goals: [
            {
                id: 'education',
                targetAmount: 50000,
                currentSavings: 0,
                monthsRemaining: 10,
                priority: 1
            },
            {
                id: 'travel',
                targetAmount: 30000,
                currentSavings: 0,
                monthsRemaining: 10,
                priority: 1
            }
        ]
    });

    assert.equal(plan.capacity.availableForGoals, 5000);
    assert.equal(plan.allocation.requiresDecision, true);
});
test('rejects invalid goals input', () => {
    assert.throws(
        () => createMonthlyPlan({
            financialProfile: {
                monthlyIncome: 30000,
                essentialExpenses: 10000,
                mandatoryDebtPayments: 0,
                currentEmergencyReserve: 10000,
                emergencyReserveTarget: 10000
            },
            goals: null
        }),
        /goals must be an array/
    );
});