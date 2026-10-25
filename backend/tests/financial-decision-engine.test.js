
import test from 'node:test';
import assert from 'node:assert/strict';

import {
    evaluateFinancialScenario
} from '../src/modules/financial-decision-engine.js';

const financialProfile = {
    monthlyIncome: 50000,
    essentialExpenses: 20000,
    mandatoryDebtPayments: 5000,
    currentEmergencyReserve: 10000,
    emergencyReserveTarget: 20000
};

const goals = [
    {
        id: 'goal-1',
        name: 'Education',
        targetAmount: 60000,
        currentSavings: 10000,
        monthsRemaining: 12,
        priority: 1
    }
];

test('creates baseline and alternative plans', () => {
    const result = evaluateFinancialScenario({
        financialProfile,
        goals
    });

    assert.ok(result.baseline);
    assert.ok(result.alternative);
    assert.ok(result.comparison);
    assert.ok(Array.isArray(result.recommendations));
});

test('income reduction decreases money available for goals', () => {
    const result = evaluateFinancialScenario({
        financialProfile,
        goals,
        scenario: {
            profileChanges: {
                monthlyIncome: 35000
            }
        }
    });

    assert.ok(
        result.alternative.capacity.availableForGoals <
        result.baseline.capacity.availableForGoals
    );
});

test('unexpected expense reduces emergency reserve', () => {
    const result = evaluateFinancialScenario({
        financialProfile,
        goals,
        scenario: {
            oneTimeExpense: 4000
        }
    });

    assert.equal(
        result.alternative.capacity.reserveShortfall,
        14000
    );

    assert.equal(
        result.scenarioDetails.uncoveredOneTimeExpense,
        0
    );
});

test('inflation increases a future goal target', () => {
    const result = evaluateFinancialScenario({
        financialProfile,
        goals,
        annualInflationRate: 0.06
    });

    assert.ok(
        result.baseline.goals[0].targetAmount >
        goals[0].targetAmount
    );
});

test('rejects an invalid inflation rate', () => {
    assert.throws(
        () => evaluateFinancialScenario({
            financialProfile,
            goals,
            annualInflationRate: 2
        }),
        /annualInflationRate/
    );
});

test('does not modify saved input objects', () => {
    const profileCopy = structuredClone(financialProfile);
    const goalsCopy = structuredClone(goals);

    evaluateFinancialScenario({
        financialProfile,
        goals,
        scenario: {
            profileChanges: {
                monthlyIncome: 30000
            },
            oneTimeExpense: 5000
        }
    });

    assert.deepEqual(financialProfile, profileCopy);
    assert.deepEqual(goals, goalsCopy);
});

test('compares goal completion estimates between plans', () => {
    const result = evaluateFinancialScenario({
        financialProfile,
        goals,
        scenario: {
            profileChanges: {
                monthlyIncome: 30000
            }
        }
    });

    const comparison = result.comparison.goals[0];

    assert.ok(
        Object.hasOwn(
            comparison,
            'baselineEstimatedCompletionMonths'
        )
    );

    assert.ok(
        Object.hasOwn(
            comparison,
            'alternativeEstimatedCompletionMonths'
        )
    );

    assert.ok(
        Object.hasOwn(
            comparison,
            'estimatedCompletionMonthsChange'
        )
    );
});

test('provides actionable decision options for goals with a projected shortfall', () => {
    const result = evaluateFinancialScenario({
        financialProfile,
        goals: [
            {
                id: 'goal-shortfall',
                name: 'House Deposit',
                targetAmount: 1000000,
                currentSavings: 0,
                monthsRemaining: 6,
                priority: 1
            }
        ]
    });

    assert.ok(Array.isArray(result.decisionOptions));

    const decision = result.decisionOptions.find(
        option => option.goalId === 'goal-shortfall'
    );

    assert.ok(
        decision,
        'Expected decision options for the underfunded goal'
    );

    assert.equal(decision.requiresUserDecision, true);

    assert.deepEqual(
        decision.options.map(option => option.action),
        [
            'extend_deadline',
            'reduce_target',
            'change_priority'
        ]
    );

    assert.ok(
        decision.options.find(
            option => option.action === 'reduce_target'
        ).suggestedTargetAmount >= 0
    );
});
