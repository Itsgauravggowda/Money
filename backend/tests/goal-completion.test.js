
import test from 'node:test';
import assert from 'node:assert/strict';

import {
    calculateGoalCompletionMonths
} from '../src/modules/goal-feasibility.js';

test('calculates months needed to complete a goal', () => {
    assert.equal(
        calculateGoalCompletionMonths({
            targetAmount: 60000,
            currentSavings: 10000,
            monthlyContribution: 5000
        }),
        10
    );
});

test('returns zero when the goal is already funded', () => {
    assert.equal(
        calculateGoalCompletionMonths({
            targetAmount: 50000,
            currentSavings: 50000,
            monthlyContribution: 5000
        }),
        0
    );
});

test('rounds up partial months', () => {
    assert.equal(
        calculateGoalCompletionMonths({
            targetAmount: 10000,
            currentSavings: 0,
            monthlyContribution: 3000
        }),
        4
    );
});

test('returns null when no contribution can be made', () => {
    assert.equal(
        calculateGoalCompletionMonths({
            targetAmount: 10000,
            currentSavings: 2000,
            monthlyContribution: 0
        }),
        null
    );
});

test('rejects negative monthly contributions', () => {
    assert.throws(
        () => calculateGoalCompletionMonths({
            targetAmount: 10000,
            currentSavings: 2000,
            monthlyContribution: -100
        }),
        /monthlyContribution/
    );
});
