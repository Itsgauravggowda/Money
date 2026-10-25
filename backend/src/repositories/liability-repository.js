import { ObjectId } from 'mongodb';
import { getDatabase } from '../db/database.js';

function requireObjectId(value, message) {
    if (!ObjectId.isValid(value)) {
        throw new Error(message);
    }

    return new ObjectId(value);
}

export async function createLiability(userId, liability) {
    const ownerId = requireObjectId(userId, 'A valid user ID is required');
    const db = getDatabase();
    const now = new Date();

    const document = {
        ...liability,
        userId: ownerId,
        createdAt: now,
        updatedAt: now
    };

    const result = await db.collection('liabilities').insertOne(document);

    return { ...document, _id: result.insertedId };
}

export async function getLiabilitiesByUser(userId) {
    const ownerId = requireObjectId(userId, 'A valid user ID is required');

    return getDatabase()
        .collection('liabilities')
        .find({ userId: ownerId })
        .sort({ createdAt: -1 })
        .toArray();
}

export async function updateLiabilityByUser(userId, liabilityId, updates) {
    const ownerId = requireObjectId(userId, 'A valid user ID is required');
    const id = requireObjectId(liabilityId, 'A valid liability ID is required');

    const result = await getDatabase().collection('liabilities').findOneAndUpdate(
        { _id: id, userId: ownerId },
        { $set: { ...updates, updatedAt: new Date() } },
        { returnDocument: 'after' }
    );

    return result?.value ?? result;
}

export async function deleteLiabilityByUser(userId, liabilityId) {
    const ownerId = requireObjectId(userId, 'A valid user ID is required');
    const id = requireObjectId(liabilityId, 'A valid liability ID is required');

    const result = await getDatabase().collection('liabilities').deleteOne({
        _id: id,
        userId: ownerId
    });

    return result.deletedCount === 1;
}
