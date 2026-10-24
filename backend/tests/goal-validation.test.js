
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { validateGoal } from '../src/modules/goal-validation.js';

test('accepts valid goal details and trims the name', () => {
    const goal = validateGoal({
        name: '  Education  ',
        targetAmount: 100000,
        currentSavings: 20000,
        monthsRemaining: 12,
        priority: 1
    });

    assert.equal(goal.name, 'Education');
    assert.equal(goal.targetAmount, 100000);
    assert.equal(goal.currentSavings, 20000);
    assert.equal(goal.monthsRemaining, 12);
    assert.equal(goal.priority, 1);
});

test('rejects an empty goal name', () => {
    assert.throws(
        () => validateGoal({
            name: '   ',
            targetAmount: 100000,
            currentSavings: 0,
            monthsRemaining: 12,
            priority: 1
        }),
        /Goal name is required/
    );
});

test('rejects a non-positive target amount', () => {
    assert.throws(
        () => validateGoal({
            name: 'Education',
            targetAmount: 0,
            currentSavings: 0,
            monthsRemaining: 12,
            priority: 1
        }),
        /Target amount must be a positive number/
    );
});

test('rejects negative current savings', () => {
    assert.throws(
        () => validateGoal({
            name: 'Education',
            targetAmount: 100000,
            currentSavings: -1,
            monthsRemaining: 12,
            priority: 1
        }),
        /Current savings must be a non-negative number/
    );
});

test('rejects invalid months remaining', () => {
    assert.throws(
        () => validateGoal({
            name: 'Education',
            targetAmount: 100000,
            currentSavings: 0,
            monthsRemaining: 1.5,
            priority: 1
        }),
        /Months remaining must be a non-negative integer/
    );
});

test('rejects an invalid priority', () => {
    assert.throws(
        () => validateGoal({
            name: 'Education',
            targetAmount: 100000,
            currentSavings: 0,
            monthsRemaining: 12,
            priority: 0
        }),
        /Priority must be a positive integer/
    );
});

test('rejects missing goal details', () => {
    assert.throws(
        () => validateGoal(null),
        /Goal details are required/
    );
});
