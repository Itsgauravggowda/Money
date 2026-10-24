
import { ObjectId } from 'mongodb';
import { getDatabase } from '../db/database.js';

export async function saveFinancialProfile(userId, profile) {
    if (!ObjectId.isValid(userId)) {
        throw new Error('A valid user ID is required');
    }

    const db = getDatabase();
    const now = new Date();

    const result = await db.collection('financial_profiles').updateOne(
        { userId: new ObjectId(userId) },
        {
            $set: {
                ...profile,
                updatedAt: now
            },
            $setOnInsert: {
                userId: new ObjectId(userId),
                createdAt: now
            }
        },
        { upsert: true }
    );

    return db.collection('financial_profiles').findOne({
        userId: new ObjectId(userId)
    });
}

export async function getFinancialProfile(userId) {
    if (!ObjectId.isValid(userId)) {
        throw new Error('A valid user ID is required');
    }

    const db = getDatabase();

    return db.collection('financial_profiles').findOne({
        userId: new ObjectId(userId)
    });
}
