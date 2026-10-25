
import { getDatabase } from './database.js';

const COLLECTIONS = [
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

export async function setupDatabase() {
    const db = getDatabase();

    // Create missing collections without deleting existing records.
    const existing = new Set(
        (await db.listCollections({}, { nameOnly: true }).toArray())
            .map(collection => collection.name)
    );

    for (const name of COLLECTIONS) {
        if (!existing.has(name)) {
            await db.createCollection(name);
        }
    }

    // Users
    await db.collection('users').createIndex(
        { email: 1 },
        {
            unique: true,
            name: 'unique_user_email'
        }
    );

    // One financial profile and one assumption document per user.
    await db.collection('financial_profiles').createIndex(
        { userId: 1 },
        {
            unique: true,
            name: 'unique_financial_profile_per_user'
        }
    );

    await db.collection('financial_assumptions').createIndex(
        { userId: 1 },
        {
            unique: true,
            name: 'unique_assumptions_per_user'
        }
    );

    // Goals and actual financial events.
    await db.collection('goals').createIndex(
        { userId: 1, createdAt: -1 },
        { name: 'goals_by_user_created_at' }
    );

    await db.collection('financial_events').createIndex(
        { userId: 1, date: -1 },
        { name: 'financial_events_by_user_date' }
    );

    await db.collection('financial_events').createIndex(
    { userId: 1, goalId: 1, date: -1 },
    { name: 'events_by_user_goal_date' }
);

    // Liabilities and recurring commitments.
    await db.collection('liabilities').createIndex(
        { userId: 1, createdAt: -1 },
        { name: 'liabilities_by_user' }
    );

    await db.collection('recurring_commitments').createIndex(
        { userId: 1, isActive: 1 },
        { name: 'commitments_by_user_status' }
    );

    // Scenarios, calculated plans and historical versions.
    await db.collection('financial_scenarios').createIndex(
        { userId: 1, createdAt: -1 },
        { name: 'scenarios_by_user_created_at' }
    );

    await db.collection('financial_plans').createIndex(
        { userId: 1, createdAt: -1 },
        { name: 'plans_by_user_created_at' }
    );

    await db.collection('plan_history').createIndex(
        { userId: 1, createdAt: -1 },
        { name: 'plan_history_by_user' }
    );

    // Recommendations and actual goal progress.
    await db.collection('recommendation_history').createIndex(
        { userId: 1, createdAt: -1 },
        { name: 'recommendations_by_user_created_at' }
    );

    await db.collection('goal_progress_snapshots').createIndex(
        { userId: 1, goalId: 1, recordedAt: -1 },
        { name: 'goal_progress_by_user_goal_date' }
    );

    console.log(
        `Money database initialized: ${COLLECTIONS.length} collections configured`
    );
}
