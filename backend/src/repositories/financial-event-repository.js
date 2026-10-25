
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

export async function getFinancialEventsByDateRange(
    userId,
    startDate,
    endDate
) {
    if (!ObjectId.isValid(userId)) {
        throw new Error('A valid user ID is required');
    }

    if (
        !(startDate instanceof Date) ||
        !(endDate instanceof Date) ||
        Number.isNaN(startDate.getTime()) ||
        Number.isNaN(endDate.getTime()) ||
        startDate >= endDate
    ) {
        throw new Error('A valid date range is required');
    }

    const db = getDatabase();

    return db
        .collection('financial_events')
        .find({
            userId: new ObjectId(userId),
            date: {
    $gte: startDate.toISOString().slice(0, 10),
    $lt: endDate.toISOString().slice(0, 10)
}
        })
        .sort({ date: 1 })
        .toArray();
}
