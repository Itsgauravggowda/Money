
import { ObjectId } from 'mongodb';
import { getDatabase } from '../db/database.js';

export async function createGoal(userId, goal) {
    if (!ObjectId.isValid(userId)) {
        throw new Error('A valid user ID is required');
    }

    const db = getDatabase();
    const now = new Date();

    const document = {
        ...goal,
        userId: new ObjectId(userId),
        createdAt: now,
        updatedAt: now
    };

    const result = await db.collection('goals').insertOne(document);

    return {
        ...document,
        _id: result.insertedId
    };
}

export async function getGoalsByUser(userId) {
    if (!ObjectId.isValid(userId)) {
        throw new Error('A valid user ID is required');
    }

    const db = getDatabase();

    return db.collection('goals')
        .find({ userId: new ObjectId(userId) })
        .sort({ createdAt: -1 })
        .toArray();
}

export async function updateGoalByUser(userId, goalId, updates) {
    if (!ObjectId.isValid(userId) || !ObjectId.isValid(goalId)) {
        throw new Error('A valid user ID and goal ID are required');
    }

    const db = getDatabase();

    const result = await db.collection('goals').findOneAndUpdate(
        {
            _id: new ObjectId(goalId),
            userId: new ObjectId(userId)
        },
        {
            $set: {
                ...updates,
                updatedAt: new Date()
            }
        },
        {
            returnDocument: 'after'
        }
    );

    // Support both modern and older MongoDB driver return formats.
    return result?.value ?? result;
}
