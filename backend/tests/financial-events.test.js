
import test from 'node:test';
import assert from 'node:assert/strict';

import {
    createFinancialEvent
} from '../src/modules/financial-events.js';

test('creates an income event', () => {
    const event = createFinancialEvent({
        type: 'income',
        amount: 80000,
        date: '2026-10-01',
        description: 'Monthly salary'
    });

    assert.equal(event.type, 'income');
    assert.equal(event.amount, 80000);
    assert.equal(event.date, '2026-10-01');
    assert.equal(event.description, 'Monthly salary');
    assert.equal(event.goalId, null);
});

test('creates an expense event', () => {
    const event = createFinancialEvent({
        type: 'expense',
        amount: 5000,
        date: '2026-10-05',
        description: 'Groceries'
    });

    assert.equal(event.type, 'expense');
    assert.equal(event.amount, 5000);
});

test('creates a debt payment event', () => {
    const event = createFinancialEvent({
        type: 'debt_payment',
        amount: 10000,
        date: '2026-10-10',
        description: 'Monthly loan payment'
    });

    assert.equal(event.type, 'debt_payment');
    assert.equal(event.amount, 10000);
});

test('requires a goal ID for goal withdrawals', () => {
    const event = createFinancialEvent({
        type: 'goal_withdrawal',
        amount: 5000,
        date: '2026-10-12',
        description: 'Emergency withdrawal',
        goalId: 'education'
    });

    assert.equal(event.type, 'goal_withdrawal');
    assert.equal(event.goalId, 'education');
});

test('rejects goal withdrawals without a goal ID', () => {
    assert.throws(
        () => createFinancialEvent({
            type: 'goal_withdrawal',
            amount: 5000,
            date: '2026-10-12',
            description: 'Emergency withdrawal'
        }),
        /goalId is required/
    );
});

test('rejects unsupported event types', () => {
    assert.throws(
        () => createFinancialEvent({
            type: 'transfer',
            amount: 1000,
            date: '2026-10-12',
            description: 'Transfer'
        }),
        /Invalid financial event type/
    );
});

test('rejects zero or negative amounts', () => {
    assert.throws(
        () => createFinancialEvent({
            type: 'expense',
            amount: 0,
            date: '2026-10-12',
            description: 'Invalid expense'
        }),
        /amount must be a positive number/
    );
});

test('rejects missing descriptions', () => {
    assert.throws(
        () => createFinancialEvent({
            type: 'expense',
            amount: 1000,
            date: '2026-10-12',
            description: '   '
        }),
        /description is required/
    );
});

test('rejects goal IDs on non-withdrawal events', () => {
    assert.throws(
        () => createFinancialEvent({
            type: 'income',
            amount: 50000,
            date: '2026-10-12',
            description: 'Salary',
            goalId: 'education'
        }),
        /goalId is only allowed/
    );
});
