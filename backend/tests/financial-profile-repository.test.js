
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ObjectId } from 'mongodb';

import {
    connectDatabase,
    closeDatabase,
    getDatabase
} from '../src/db/database.js';

import {
    saveFinancialProfile,
    getFinancialProfile
} from '../src/repositories/financial-profile-repository.js';

const validProfile = {
    monthlyIncome: 50000,
    essentialExpenses: 20000,
    mandatoryDebtPayments: 5000,
    currentEmergencyReserve: 10000,
    emergencyReserveTarget: 15000
};

test('saves, updates and retrieves a financial profile for its owner', async () => {
    await connectDatabase();

    const db = getDatabase();
    const userId = new ObjectId().toString();

    try {
        const saved = await saveFinancialProfile(
            userId,
            validProfile
        );

        assert.equal(saved.userId.toString(), userId);
        assert.equal(saved.monthlyIncome, 50000);
        assert.ok(saved.createdAt instanceof Date);
        assert.ok(saved.updatedAt instanceof Date);

        const updatedProfile = {
            ...validProfile,
            monthlyIncome: 60000
        };

        const updated = await saveFinancialProfile(
            userId,
            updatedProfile
        );

        assert.equal(updated.monthlyIncome, 60000);
        assert.equal(updated._id.toString(), saved._id.toString());

        const retrieved = await getFinancialProfile(userId);

        assert.equal(retrieved.monthlyIncome, 60000);

        const count = await db.collection('financial_profiles')
            .countDocuments({ userId: new ObjectId(userId) });

        assert.equal(count, 1);
    } finally {
        await db.collection('financial_profiles').deleteMany({
            userId: new ObjectId(userId)
        });

        await closeDatabase();
    }
});

test('rejects an invalid user ID', async () => {
    await connectDatabase();

    try {
        await assert.rejects(
            () => getFinancialProfile('invalid-user-id'),
            /A valid user ID is required/
        );

        await assert.rejects(
            () => saveFinancialProfile('invalid-user-id', validProfile),
            /A valid user ID is required/
        );
    } finally {
        await closeDatabase();
    }
});
