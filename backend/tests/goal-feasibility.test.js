
import test from 'node:test';
import assert from 'node:assert/strict';

import {
    calculateGoalFeasibility
} from '../src/modules/goal-feasibility.js';

test('identifies an achievable goal', () => {
    const result = calculateGoalFeasibility({
        targetAmount: 120000,
        currentSavings: 20000,
        monthsRemaining: 10,
        monthlyContributionCapacity: 12000
    });

    assert.equal(result.remainingAmount, 100000);
    assert.equal(result.requiredMonthlyContribution, 10000);
    assert.equal(result.projectedAmount, 140000);
    assert.equal(result.projectedShortfall, 0);
    assert.equal(result.achievable, true);
});

test('identifies a goal with a projected shortfall', () => {
    const result = calculateGoalFeasibility({
        targetAmount: 120000,
        currentSavings: 20000,
        monthsRemaining: 10,
        monthlyContributionCapacity: 8000
    });

    assert.equal(result.requiredMonthlyContribution, 10000);
    assert.equal(result.projectedAmount, 100000);
    assert.equal(result.projectedShortfall, 20000);
    assert.equal(result.achievable, false);
});


test('recognises a goal that is already fully funded', () => {
    const result = calculateGoalFeasibility({
        targetAmount: 100000,
        currentSavings: 100000,
        monthsRemaining: 0,
        monthlyContributionCapacity: 0
    });

    assert.equal(result.remainingAmount, 0);
    assert.equal(result.requiredMonthlyContribution, 0);
    assert.equal(result.achievable, true);
    assert.equal(result.deadlineStatus, 'funded');
});


test('identifies an unfunded goal whose deadline has arrived', () => {
    const result = calculateGoalFeasibility({
        targetAmount: 100000,
        currentSavings: 40000,
        monthsRemaining: 0,
        monthlyContributionCapacity: 10000
    });

    assert.equal(result.remainingAmount, 60000);
    assert.equal(result.requiredMonthlyContribution, 60000);
    assert.equal(result.projectedShortfall, 60000);
    assert.equal(result.achievable, false);
});

test('rejects negative target amounts', () => {
    assert.throws(
        () => calculateGoalFeasibility({
            targetAmount: -1000,
            currentSavings: 0,
            monthsRemaining: 10,
            monthlyContributionCapacity: 10000
        }),
        /targetAmount must be a non-negative number/
    );
});

test('rejects negative months remaining', () => {
    assert.throws(
        () => calculateGoalFeasibility({
            targetAmount: 100000,
            currentSavings: 0,
            monthsRemaining: -1,
            monthlyContributionCapacity: 10000
        }),
        /monthsRemaining must be a non-negative integer/
    );
});


test('identifies the monthly contribution required for a goal independently of other goals', () => {
    const result = calculateGoalFeasibility({
        targetAmount: 120000,
        currentSavings: 20000,
        monthsRemaining: 10,
        monthlyContributionCapacity: 20000
    });

    assert.equal(result.remainingAmount, 100000);
    assert.equal(result.requiredMonthlyContribution, 10000);
    assert.equal(result.achievable, true);
});

test('identifies an overdue goal that still has money remaining', () => {
    const result = calculateGoalFeasibility({
        targetAmount: 100000,
        currentSavings: 40000,
        monthsRemaining: 0,
        monthlyContributionCapacity: 10000
    });

    assert.equal(result.remainingAmount, 60000);
    assert.equal(result.achievable, false);
    assert.equal(result.projectedShortfall, 60000);
});
