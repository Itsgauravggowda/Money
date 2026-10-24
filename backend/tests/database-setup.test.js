
import 'dotenv/config';

import test from 'node:test';
import assert from 'node:assert/strict';

import {
    connectDatabase,
    closeDatabase
} from '../src/db/database.js';

import {
    setupDatabase
} from '../src/db/setup.js';

test('creates a unique index on user email', async () => {
    try {
        const db = await connectDatabase();

        await setupDatabase();

        const indexes = await db
            .collection('users')
            .listIndexes()
            .toArray();

        const emailIndex = indexes.find(
            index => index.name === 'unique_user_email'
        );

        assert.ok(emailIndex);
        assert.equal(emailIndex.unique, true);
        assert.equal(emailIndex.key.email, 1);
    } finally {
        await closeDatabase();
    }
});
