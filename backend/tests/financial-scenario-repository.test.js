
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ObjectId } from 'mongodb';

import {
    connectDatabase,
    closeDatabase,
    getDatabase
} from '../src/db/database.js';

import {
    saveFinancialScenario
} from '../src/repositories/financial-scenario-repository.js';

test('rolls back a saved scenario when saving its plan fails', async () => {
    await connectDatabase();

    const db = getDatabase();
    const userId = new ObjectId();
    const originalCollection = db.collection;

    const scenarios = originalCollection.call(
        db,
        'financial_scenarios'
    );

    const plans = originalCollection.call(
        db,
        'financial_plans'
    );

    try {
        const originalScenarioCount =
            await scenarios.countDocuments({ userId });

        // Simulate a database failure when saving the plan.
        db.collection = function (name, ...args) {
            if (name === 'financial_plans') {
                return {
                    insertOne: async () => {
                        throw new Error('Simulated plan save failure');
                    }
                };
            }

            return originalCollection.call(this, name, ...args);
        };

        await assert.rejects(
            saveFinancialScenario(
                userId.toString(),
                { testScenario: true },
                {
                    baseline: {},
                    alternative: {},
                    comparison: {}
                }
            ),
            /Simulated plan save failure/
        );

        // Restore normal database access before verifying rollback.
        db.collection = originalCollection;

        const remainingScenarioCount =
            await scenarios.countDocuments({ userId });

        assert.equal(
            remainingScenarioCount,
            originalScenarioCount,
            'The failed save must not leave an orphaned scenario'
        );
    } finally {
        db.collection = originalCollection;

        await scenarios.deleteMany({ userId });
        await plans.deleteMany({ userId });

        await closeDatabase();
    }
});
