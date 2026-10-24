
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
    createUserGoal,
    getUserGoals
} from '../src/services/goal-service.js';

test('rejects invalid goal details before saving', async () => {
    await assert.rejects(
        createUserGoal('507f1f77bcf86cd799439011', {
            name: '',
            targetAmount: 100000,
            currentSavings: 0,
            monthsRemaining: 12,
            priority: 1
        }),
        /Goal name is required/
    );
});

test('exposes functions for creating and retrieving user goals', () => {
    assert.equal(typeof createUserGoal, 'function');
    assert.equal(typeof getUserGoals, 'function');
});

test('exposes a function for updating user goals', async () => {
    const { updateUserGoal } = await import(
        '../src/services/goal-service.js'
    );

    assert.equal(typeof updateUserGoal, 'function');
});
