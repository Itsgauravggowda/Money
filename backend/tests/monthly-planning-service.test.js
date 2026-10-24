
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
    connectDatabase,
    closeDatabase
} from '../src/db/database.js';

import {
    generateUserMonthlyPlan
} from '../src/services/monthly-planning-service.js';

test('exports the monthly planning service', () => {
    assert.equal(typeof generateUserMonthlyPlan, 'function');
});

test('requires a financial profile before generating a plan', async () => {
    await connectDatabase();

    try {
        await assert.rejects(
            () => generateUserMonthlyPlan(
                '507f1f77bcf86cd799439011'
            ),
            /Financial profile must be created before generating a plan/
        );
    } finally {
        await closeDatabase();
    }
});
