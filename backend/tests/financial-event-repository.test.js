
import 'dotenv/config';

import test from 'node:test';
import assert from 'node:assert/strict';

import {
    connectDatabase,
    closeDatabase
} from '../src/db/database.js';

import {
    saveFinancialEvent,
    getFinancialEvents
} from '../src/repositories/financial-event-repository.js';

import {
    createFinancialEvent
} from '../src/modules/financial-events.js';

test('saves and retrieves a financial event from MongoDB', async () => {
    let db;

    try {
        db = await connectDatabase();

        const event = createFinancialEvent({
            type: 'income',
            amount: 80000,
            date: '2026-10-01',
            description: 'Repository integration test'
        });

        const savedEvent = await saveFinancialEvent(event);

        assert.ok(savedEvent._id);
        assert.equal(savedEvent.type, 'income');
        assert.equal(savedEvent.amount, 80000);
        assert.equal(savedEvent.description, 'Repository integration test');

        const retrievedEvent = await db
            .collection('financial_events')
            .findOne({ _id: savedEvent._id });

        assert.ok(retrievedEvent);
        assert.equal(retrievedEvent.amount, 80000);
        assert.ok(retrievedEvent.createdAt instanceof Date);

        // Clean up the test document so repeated test runs
        // do not leave extra test data in the database.
        await db
            .collection('financial_events')
            .deleteOne({ _id: savedEvent._id });
    } finally {
        await closeDatabase();
    }
});

test('retrieves financial events as an array', async () => {
    try {
        await connectDatabase();

        const events = await getFinancialEvents();

        assert.ok(Array.isArray(events));
    } finally {
        await closeDatabase();
    }
});
