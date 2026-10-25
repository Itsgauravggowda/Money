
import { ObjectId } from 'mongodb';
import { getDatabase } from '../db/database.js';

export async function saveFinancialScenario(
    userId,
    input,
    result
) {
    if (!ObjectId.isValid(userId)) {
        throw new Error('A valid user ID is required');
    }

    const db = getDatabase();
    const now = new Date();
    const ownerId = new ObjectId(userId);

    const document = {
        userId: ownerId,
        input,
        result,
        createdAt: now,
        updatedAt: now
    };

    const savedScenario = await db
        .collection('financial_scenarios')
        .insertOne(document);

    const savedPlan = await db
        .collection('financial_plans')
        .insertOne({
            userId: ownerId,
            scenarioId: savedScenario.insertedId,
            baseline: result.baseline,
            alternative: result.alternative,
            comparison: result.comparison,
            createdAt: now
        });

    return {
        scenarioId: savedScenario.insertedId.toString(),
        planId: savedPlan.insertedId.toString(),
        createdAt: now
    };
}

export async function getFinancialScenariosByUser(userId) {
    if (!ObjectId.isValid(userId)) {
        throw new Error('A valid user ID is required');
    }

    return getDatabase()
        .collection('financial_scenarios')
        .find({ userId: new ObjectId(userId) })
        .sort({ createdAt: -1 })
        .toArray();
}
