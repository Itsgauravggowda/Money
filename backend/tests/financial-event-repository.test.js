
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ObjectId } from 'mongodb';

import {
    connectDatabase,
    closeDatabase,
    getDatabase
} from '../src/db/database.js';

import {
    saveFinancialEvent,
    getFinancialEvents,
    getFinancialEventsByDateRange
} from '../src/repositories/financial-event-repository.js';

test('saves and retrieves financial events for the correct user', async () => {
    await connectDatabase();

    const db = getDatabase();
    const userId = new ObjectId();
    const otherUserId = new ObjectId();
    const testDescription = `Repository test ${new ObjectId()}`;

    try {
        const saved = await saveFinancialEvent(userId.toString(), {
            type: 'income',
            amount: 2500,
            date: new Date().toISOString(),
            description: testDescription,
            goalId: null
        });

        assert.equal(saved.userId.toString(), userId.toString());

        const ownEvents = await getFinancialEvents(userId.toString());
        const otherEvents = await getFinancialEvents(otherUserId.toString());

        assert.ok(
            ownEvents.some(event => event._id.equals(saved._id)),
            'The owner should be able to retrieve the event'
        );

        assert.ok(
            !otherEvents.some(event => event._id.equals(saved._id)),
            'Another user must not retrieve the event'
        );
    } finally {
        await db.collection('financial_events').deleteMany({
            userId: { $in: [userId, otherUserId] }
        });

        await closeDatabase();
    }
});

test('rejects an invalid user ID when saving or retrieving events', async () => {
    await assert.rejects(
        saveFinancialEvent('invalid-user-id', {
            type: 'income',
            amount: 100,
            date: new Date().toISOString(),
            description: 'Test event',
            goalId: null
        }),
        /valid user ID is required/
    );

    await assert.rejects(
        getFinancialEvents('invalid-user-id'),
        /valid user ID is required/
    );
});

test('filters financial events by date range including the start date', async () => {
    await connectDatabase();

    const db = getDatabase();
    const userId = new ObjectId();
    const marker = `Date range test ${new ObjectId()}`;

    try {
        await saveFinancialEvent(userId.toString(), {
            type: 'income',
            amount: 1000,
            date: '2026-10-01',
            description: `${marker} start`,
            goalId: null
        });

        await saveFinancialEvent(userId.toString(), {
            type: 'expense',
            amount: 500,
            date: '2026-10-31',
            description: `${marker} end`,
            goalId: null
        });

        await saveFinancialEvent(userId.toString(), {
            type: 'expense',
            amount: 200,
            date: '2026-11-01',
            description: `${marker} outside`,
            goalId: null
        });

        const events = await getFinancialEventsByDateRange(
            userId.toString(),
            new Date('2026-10-01T00:00:00.000Z'),
            new Date('2026-11-01T00:00:00.000Z')
        );

        const matchingEvents = events.filter(event =>
            event.description.startsWith(marker)
        );

        assert.equal(matchingEvents.length, 2);
        assert.ok(
            matchingEvents.some(event => event.description === `${marker} start`)
        );
        assert.ok(
            matchingEvents.some(event => event.description === `${marker} end`)
        );
        assert.ok(
            !matchingEvents.some(event => event.description === `${marker} outside`)
        );
    } finally {
        await db.collection('financial_events').deleteMany({
            userId
        });

        await closeDatabase();
    }
});
