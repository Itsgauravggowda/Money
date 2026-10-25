
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

test('creates all required collections and indexes', async () => {
    try {
        const db = await connectDatabase();

        await setupDatabase();

        const requiredCollections = [
            'users',
            'financial_profiles',
            'goals',
            'financial_events',
            'liabilities',
            'recurring_commitments',
            'financial_assumptions',
            'financial_scenarios',
            'financial_plans',
            'plan_history',
            'recommendation_history',
            'goal_progress_snapshots'
        ];

        const existingCollections = new Set(
            (await db.listCollections({}, { nameOnly: true }).toArray())
                .map(collection => collection.name)
        );

        for (const name of requiredCollections) {
            assert.ok(
                existingCollections.has(name),
                `Missing collection: ${name}`
            );
        }

        const indexChecks = [
            ['users', 'unique_user_email', true],
            ['financial_profiles', 'unique_financial_profile_per_user', true],
            ['financial_assumptions', 'unique_assumptions_per_user', true],
            ['goals', 'goals_by_user_created_at', false],
            ['financial_events', 'financial_events_by_user_date', false],
            ['financial_events', 'events_by_user_goal_date', false],
            ['liabilities', 'liabilities_by_user', false],
            ['recurring_commitments', 'commitments_by_user_status', false],
            ['financial_scenarios', 'scenarios_by_user_created_at', false],
            ['financial_plans', 'plans_by_user_created_at', false],
            ['plan_history', 'plan_history_by_user', false],
            ['recommendation_history', 'recommendations_by_user_created_at', false],
            ['goal_progress_snapshots', 'goal_progress_by_user_goal_date', false]
        ];

        for (const [collectionName, indexName, unique] of indexChecks) {
            const indexes = await db
                .collection(collectionName)
                .listIndexes()
                .toArray();

            const index = indexes.find(item => item.name === indexName);

            assert.ok(
                index,
                `Missing index "${indexName}" on "${collectionName}"`
            );

            if (unique) {
                assert.equal(index.unique, true);
            }
        }
    } finally {
        await closeDatabase();
    }
});
