
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
    createMonthlyPlan
} from '../src/modules/monthly-planning.js';

const standardProfile = {
    monthlyIncome: 50000,
    essentialExpenses: 20000,
    mandatoryDebtPayments: 5000,
    currentEmergencyReserve: 10000,
    emergencyReserveTarget: 15000
};

const standardGoals = [
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
];

test('creates a monthly plan using financial capacity and goal priorities', () => {
    const plan = createMonthlyPlan({
        financialProfile: standardProfile,
        goals: standardGoals
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

    assert.equal(plan.allocation.unallocatedAmount, 12000);
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
        goals: [{
            id: 'education',
            targetAmount: 50000,
            currentSavings: 10000,
            monthsRemaining: 10,
            priority: 1
        }]
    });

    assert.equal(plan.capacity.hasMonthlyDeficit, true);
    assert.equal(plan.capacity.monthlySurplus, -5000);
    assert.equal(plan.capacity.availableForGoals, 0);
    assert.deepEqual(plan.allocation.allocations, []);
    assert.equal(plan.feasibility[0].allocatedContribution, 0);
    assert.equal(plan.feasibility[0].achievable, false);
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

    assert.ok(
        plan.allocation.decisionReason
    );

    for (const goal of plan.feasibility) {
        assert.equal(goal.allocatedContribution, 0);
        assert.equal(goal.achievable, false);
    }
});

test('rejects invalid goals input', () => {
    assert.throws(
        () => createMonthlyPlan({
            financialProfile: standardProfile,
            goals: null
        }),
        /goals must be an array/
    );
});

test('evaluates feasibility using actual allocations rather than total available money', () => {
    const plan = createMonthlyPlan({
        financialProfile: {
            monthlyIncome: 30000,
            essentialExpenses: 10000,
            mandatoryDebtPayments: 0,
            currentEmergencyReserve: 10000,
            emergencyReserveTarget: 10000
        },
        goals: [
            {
                id: 'education',
                targetAmount: 120000,
                currentSavings: 20000,
                monthsRemaining: 10,
                priority: 1
            },
            {
                id: 'laptop',
                targetAmount: 120000,
                currentSavings: 0,
                monthsRemaining: 10,
                priority: 1
            }
        ]
    });

    assert.equal(plan.capacity.availableForGoals, 20000);
    assert.equal(plan.allocation.requiresDecision, true);

    assert.equal(plan.feasibility[0].achievable, false);
    assert.equal(plan.feasibility[1].achievable, false);

    assert.equal(plan.feasibility[0].allocatedContribution, 0);
    assert.equal(plan.feasibility[0].allocationShortfall, 10000);

    assert.equal(plan.feasibility[1].allocatedContribution, 0);
    assert.equal(plan.feasibility[1].allocationShortfall, 12000);
});

test('includes deadline status in monthly plan feasibility results', () => {
    const plan = createMonthlyPlan({
        financialProfile: {
            monthlyIncome: 30000,
            essentialExpenses: 10000,
            mandatoryDebtPayments: 0,
            currentEmergencyReserve: 10000,
            emergencyReserveTarget: 10000
        },
        goals: [{
            id: 'overdue-goal',
            targetAmount: 100000,
            currentSavings: 40000,
            monthsRemaining: 0,
            priority: 1
        }]
    });

    assert.equal(
        plan.feasibility[0].deadlineStatus,
        'deadline_reached'
    );
});

test('does not allocate money to an overdue goal as a normal monthly contribution', () => {
    const plan = createMonthlyPlan({
        financialProfile: {
            monthlyIncome: 30000,
            essentialExpenses: 10000,
            mandatoryDebtPayments: 0,
            currentEmergencyReserve: 10000,
            emergencyReserveTarget: 10000
        },
        goals: [
            {
                id: 'overdue-goal',
                targetAmount: 100000,
                currentSavings: 40000,
                monthsRemaining: 0,
                priority: 1
            },
            {
                id: 'active-goal',
                targetAmount: 60000,
                currentSavings: 0,
                monthsRemaining: 10,
                priority: 2
            }
        ]
    });

    const overdueGoal = plan.allocation.allocations.find(
        item => item.goalId === 'overdue-goal'
    );

    const activeGoal = plan.allocation.allocations.find(
        item => item.goalId === 'active-goal'
    );

    assert.equal(overdueGoal.requestedContribution, 0);
    assert.equal(overdueGoal.allocatedContribution, 0);
    assert.equal(activeGoal.allocatedContribution, 6000);
});

test('marks overdue goals for deadline review without a numeric allocation shortfall', () => {
    const plan = createMonthlyPlan({
        financialProfile: {
            monthlyIncome: 30000,
            essentialExpenses: 10000,
            mandatoryDebtPayments: 0,
            currentEmergencyReserve: 10000,
            emergencyReserveTarget: 10000
        },
        goals: [{
            id: 'overdue-goal',
            targetAmount: 100000,
            currentSavings: 40000,
            monthsRemaining: 0,
            priority: 1
        }]
    });

    const overdueGoal = plan.feasibility[0];

    assert.equal(overdueGoal.remainingAmount, 60000);
    assert.equal(overdueGoal.requiredMonthlyContribution, null);
    assert.equal(overdueGoal.allocationShortfall, null);
    assert.equal(overdueGoal.requiresDeadlineReview, true);
});

test('marks a goal achievable when its actual allocation covers its required contribution', () => {
    const plan = createMonthlyPlan({
        financialProfile: {
            monthlyIncome: 30000,
            essentialExpenses: 10000,
            mandatoryDebtPayments: 0,
            currentEmergencyReserve: 10000,
            emergencyReserveTarget: 10000
        },
        goals: [{
            id: 'emergency-fund',
            targetAmount: 60000,
            currentSavings: 0,
            monthsRemaining: 6,
            priority: 1
        }]
    });

    const goal = plan.feasibility[0];

    assert.equal(goal.requiredMonthlyContribution, 10000);
    assert.equal(goal.allocatedContribution, 10000);
    assert.equal(goal.achievable, true);
    assert.equal(goal.projectedShortfall, 0);
    assert.equal(goal.allocationShortfall, 0);
});

test('rejects duplicate goal IDs', () => {
    assert.throws(
        () => createMonthlyPlan({
            financialProfile: standardProfile,
            goals: [
                {
                    id: 'duplicate',
                    targetAmount: 10000,
                    currentSavings: 0,
                    monthsRemaining: 10,
                    priority: 1
                },
                {
                    id: 'duplicate',
                    targetAmount: 20000,
                    currentSavings: 0,
                    monthsRemaining: 10,
                    priority: 2
                }
            ]
        }),
        /Duplicate goal id/
    );
});
