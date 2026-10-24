
import { ObjectId } from 'mongodb';
import { getDatabase } from '../db/database.js';

export async function saveFinancialEvent(userId, event) {
    if (!ObjectId.isValid(userId)) {
        throw new Error('A valid user ID is required');
    }

    const db = getDatabase();

    const document = {
        ...event,
        userId: new ObjectId(userId),
        createdAt: new Date()
    };

    const result = await db
        .collection('financial_events')
        .insertOne(document);

    return {
        ...document,
        _id: result.insertedId
    };
}

export async function getFinancialEvents(userId) {
    if (!ObjectId.isValid(userId)) {
        throw new Error('A valid user ID is required');
    }

    const db = getDatabase();

    return db
        .collection('financial_events')
        .find({
            userId: new ObjectId(userId)
        })
        .sort({ date: -1 })
        .toArray();
}
