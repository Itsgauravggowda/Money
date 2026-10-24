
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
    validateFinancialProfile
} from '../src/modules/financial-profile.js';

const validProfile = {
    monthlyIncome: 50000,
    essentialExpenses: 20000,
    mandatoryDebtPayments: 5000,
    currentEmergencyReserve: 10000,
    emergencyReserveTarget: 15000
};

test('accepts a valid financial profile', () => {
    assert.deepEqual(
        validateFinancialProfile(validProfile),
        validProfile
    );
});

test('rejects missing profile details', () => {
    assert.throws(
        () => validateFinancialProfile(null),
        /Financial profile details are required/
    );
});

test('rejects negative financial values', () => {
    assert.throws(
        () => validateFinancialProfile({
            ...validProfile,
            essentialExpenses: -100
        }),
        /essentialExpenses must be a non-negative number/
    );
});

test('rejects numeric values supplied as strings', () => {
    assert.throws(
        () => validateFinancialProfile({
            ...validProfile,
            monthlyIncome: '50000'
        }),
        /monthlyIncome must be a non-negative number/
    );
});

test('rejects missing required fields', () => {
    const { monthlyIncome, ...incompleteProfile } = validProfile;

    assert.throws(
        () => validateFinancialProfile(incompleteProfile),
        /monthlyIncome must be a non-negative number/
    );
});
