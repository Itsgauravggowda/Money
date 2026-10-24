
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ObjectId } from 'mongodb';

import {
    createGoal,
    getGoalsByUser
} from '../src/repositories/goal-repository.js';

import {
    connectDatabase,
    closeDatabase
} from '../src/db/database.js';

test('saves and retrieves goals only for the correct user', async () => {
    await connectDatabase();

    const userA = new ObjectId().toString();
    const userB = new ObjectId().toString();

    const goal = await createGoal(userA, {
        name: 'Education',
        targetAmount: 100000,
        currentSavings: 20000,
        monthsRemaining: 12,
        priority: 1
    });

    try {
        const goalsA = await getGoalsByUser(userA);
        const goalsB = await getGoalsByUser(userB);

        assert.ok(
            goalsA.some(item => item._id.toString() === goal._id.toString())
        );

        assert.equal(
            goalsB.some(item => item._id.toString() === goal._id.toString()),
            false
        );
    } finally {
        const { getDatabase } = await import('../src/db/database.js');

        await getDatabase().collection('goals').deleteOne({
            _id: goal._id
        });

        await closeDatabase();
    }
});

test('rejects invalid user IDs when creating or retrieving goals', async () => {
    await connectDatabase();

    try {
        await assert.rejects(
            createGoal('invalid-user-id', {
                name: 'Education',
                targetAmount: 100000,
                currentSavings: 0,
                monthsRemaining: 12,
                priority: 1
            }),
            /A valid user ID is required/
        );

        await assert.rejects(
            getGoalsByUser('invalid-user-id'),
            /A valid user ID is required/
        );
    } finally {
        await closeDatabase();
    }
});
