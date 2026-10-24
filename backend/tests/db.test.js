
import 'dotenv/config';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    connectDatabase,
    closeDatabase
} from '../src/db/database.js';

test('connects to MongoDB successfully', async () => {
    try {
        const db = await connectDatabase();

        const result = await db.command({ ping: 1 });

        assert.equal(result.ok, 1);

        console.log(`Connected to database: ${db.databaseName}`);
    } finally {
        await closeDatabase();
    }
});
