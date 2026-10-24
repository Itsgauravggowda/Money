
import { getDatabase } from '../db/database.js';

export async function saveFinancialEvent(event) {
    const db = getDatabase();

    const document = {
        ...event,
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

export async function getFinancialEvents() {
    const db = getDatabase();

    return db
        .collection('financial_events')
        .find({})
        .sort({ date: -1 })
        .toArray();
}
