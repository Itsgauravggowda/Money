import test from 'node:test';
import assert from 'node:assert/strict';

import {
    validateLiability,
    validateLiabilityUpdate
} from '../src/modules/liability-validation.js';

const validLiability = {
    name: 'Education Loan',
    type: 'education_loan',
    outstandingBalance: 250000,
    interestRate: 9.5,
    minimumMonthlyPayment: 6500,
    dueDate: '2026-11-05'
};

test('accepts valid liability details and supplies isActive default', () => {
    const result = validateLiability(validLiability);

    assert.equal(result.name, 'Education Loan');
    assert.equal(result.type, 'education_loan');
    assert.equal(result.outstandingBalance, 250000);
    assert.equal(result.interestRate, 9.5);
    assert.equal(result.minimumMonthlyPayment, 6500);
    assert.equal(result.dueDate, '2026-11-05');
    assert.equal(result.isActive, true);
});

test('trims liability name', () => {
    assert.equal(
        validateLiability({ ...validLiability, name: '  Loan  ' }).name,
        'Loan'
    );
});

test('rejects unsupported liability types', () => {
    assert.throws(
        () => validateLiability({ ...validLiability, type: 'crypto' }),
        /Liability type is invalid/
    );
});

test('rejects negative or non-finite money values', () => {
    for (const value of [-1, Infinity, NaN, '100']) {
        assert.throws(
            () => validateLiability({
                ...validLiability,
                outstandingBalance: value
            }),
            /outstandingBalance must be a non-negative number/
        );
    }
});

test('rejects interest rates outside 0 to 100', () => {
    for (const value of [-0.1, 100.1, NaN, '5']) {
        assert.throws(
            () => validateLiability({ ...validLiability, interestRate: value }),
            /interestRate must be between 0 and 100/
        );
    }
});

test('rejects impossible calendar dates', () => {
    assert.throws(
        () => validateLiability({ ...validLiability, dueDate: '2026-02-30' }),
        /dueDate must be a valid/
    );
});

test('allows an absent due date', () => {
    assert.equal(
        validateLiability({ ...validLiability, dueDate: null }).dueDate,
        null
    );
});

test('rejects update attempts to change protected fields', () => {
    assert.throws(
        () => validateLiabilityUpdate({ userId: 'another-user' }),
        /cannot be updated/
    );
});

test('rejects an empty update', () => {
    assert.throws(
        () => validateLiabilityUpdate({}),
        /At least one liability field must be provided/
    );
});

test('validates partial updates', () => {
    assert.deepEqual(
        validateLiabilityUpdate({ outstandingBalance: 100000, isActive: false }),
        { outstandingBalance: 100000, isActive: false }
    );
});
