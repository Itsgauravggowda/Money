
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
    saveUserFinancialProfile,
    getUserFinancialProfile
} from '../src/services/financial-profile-service.js';

test('rejects an invalid profile before saving', async () => {
    await assert.rejects(
        () => saveUserFinancialProfile('507f1f77bcf86cd799439011', {
            monthlyIncome: -100,
            essentialExpenses: 20000,
            mandatoryDebtPayments: 5000,
            currentEmergencyReserve: 10000,
            emergencyReserveTarget: 15000
        }),
        /monthlyIncome must be a non-negative number/
    );
});

test('exposes the financial profile service functions', () => {
    assert.equal(typeof saveUserFinancialProfile, 'function');
    assert.equal(typeof getUserFinancialProfile, 'function');
});
