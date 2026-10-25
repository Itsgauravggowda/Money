
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
test('repays the portion of an unexpected expense not covered by reserves', () => {
    const result = evaluateFinancialScenario({
        financialProfile,
        goals,
        scenario: {
            oneTimeExpense: 25000,
            uncoveredExpenseRepaymentMonths: 5
        }
    });

    assert.equal(result.scenarioDetails.reserveUsed, 10000);
    assert.equal(result.scenarioDetails.uncoveredOneTimeExpense, 15000);
    assert.equal(result.scenarioDetails.monthlyEmergencyRepayment, 3000);

    // The alternative plan must account for the extra monthly repayment.
    assert.equal(
        result.alternative.capacity.monthlySurplus,
        result.baseline.capacity.monthlySurplus - 3000
    );

    // The original financial profile must remain unchanged.
    assert.equal(financialProfile.currentEmergencyReserve, 10000);
    assert.equal(financialProfile.mandatoryDebtPayments, 5000);
});

test('uses scenario-specific inflation without changing baseline inflation', () => {
    const result = evaluateFinancialScenario({
        financialProfile,
        goals,
        annualInflationRate: 0.02,
        scenario: {
            annualInflationRate: 0.10
        }
    });

    assert.equal(
        result.baseline.assumptions.annualInflationRate,
        0.02
    );

    assert.equal(
        result.alternative.assumptions.annualInflationRate,
        0.10
    );

    assert.ok(
        result.alternative.goals[0].targetAmount >
        result.baseline.goals[0].targetAmount
    );
});

test('rejects a negative unexpected expense', () => {
    assert.throws(
        () => evaluateFinancialScenario({
            financialProfile,
            goals,
            scenario: {
                oneTimeExpense: -1000
            }
        }),
        /oneTimeExpense/
    );
});

test('rejects an invalid emergency repayment period', () => {
    assert.throws(
        () => evaluateFinancialScenario({
            financialProfile,
            goals,
            scenario: {
                oneTimeExpense: 20000,
                uncoveredExpenseRepaymentMonths: 0
            }
        }),
        /uncoveredExpenseRepaymentMonths/
    );
});

test('rejects unsupported financial profile changes', () => {
    assert.throws(
        () => evaluateFinancialScenario({
            financialProfile,
            goals,
            scenario: {
                profileChanges: {
                    accountBalance: 100000
                }
            }
        }),
        /cannot change profile field/
    );
});

test('applies goal changes to the alternative plan only', () => {
    const originalTarget = goals[0].targetAmount;

    const result = evaluateFinancialScenario({
        financialProfile,
        goals,
        scenario: {
            goalChanges: [
                {
                    id: 'goal-1',
                    targetAmount: 100000
                }
            ]
        }
    });

    assert.equal(result.baseline.goals[0].targetAmount, originalTarget);
    assert.equal(result.alternative.goals[0].targetAmount, 100000);
    assert.equal(goals[0].targetAmount, originalTarget);
});

test('rejects a scenario change for a goal that does not exist', () => {
    assert.throws(
        () => evaluateFinancialScenario({
            financialProfile,
            goals,
            scenario: {
                goalChanges: [
                    {
                        id: 'missing-goal',
                        targetAmount: 50000
                    }
                ]
            }
        }),
        /was not found/
    );
});

test('rejects invalid scenario-specific inflation', () => {
    assert.throws(
        () => evaluateFinancialScenario({
            financialProfile,
            goals,
            scenario: {
                annualInflationRate: 1.5
            }
        }),
        /annualInflationRate/
    );
});