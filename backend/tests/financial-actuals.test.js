
import test from 'node:test';
import assert from 'node:assert/strict';

import {
    summarizeFinancialActuals
} from '../src/modules/financial-actuals.js';

const startDate = new Date('2026-10-01T00:00:00.000Z');
const endDate = new Date('2026-11-01T00:00:00.000Z');

test('summarizes income, expenses, and debt payments', () => {
    const result = summarizeFinancialActuals({
        startDate,
        endDate,
        events: [
            { type: 'income', amount: 30000, date: '2026-10-05' },
            { type: 'expense', amount: 8000, date: '2026-10-06' },
            { type: 'debt_payment', amount: 3000, date: '2026-10-07' }
        ]
    });

    assert.equal(result.totalIncome, 30000);
    assert.equal(result.totalExpenses, 8000);
    assert.equal(result.totalDebtPayments, 3000);
    assert.equal(result.netRecordedCashFlow, 19000);
    assert.equal(result.eventCount, 3);
});

test('groups goal withdrawals by goal ID', () => {
    const result = summarizeFinancialActuals({
        startDate,
        endDate,
        events: [
            {
                type: 'goal_withdrawal',
                amount: 1000,
                date: '2026-10-05',
                goalId: 'goal-1'
            },
            {
                type: 'goal_withdrawal',
                amount: 500,
                date: '2026-10-10',
                goalId: 'goal-1'
            },
            {
                type: 'goal_withdrawal',
                amount: 200,
                date: '2026-10-12',
                goalId: 'goal-2'
            }
        ]
    });

    assert.equal(result.totalGoalWithdrawals, 1700);
    assert.equal(result.goalWithdrawals['goal-1'], 1500);
    assert.equal(result.goalWithdrawals['goal-2'], 200);
});

test('rejects events outside the requested date range', () => {
    assert.throws(
        () => summarizeFinancialActuals({
            startDate,
            endDate,
            events: [
                {
                    type: 'expense',
                    amount: 100,
                    date: '2026-11-01'
                }
            ]
        }),
        /outside the requested range/
    );
});

test('rejects invalid event amounts', () => {
    assert.throws(
        () => summarizeFinancialActuals({
            startDate,
            endDate,
            events: [
                {
                    type: 'income',
                    amount: -100,
                    date: '2026-10-05'
                }
            ]
        }),
        /positive number/
    );
});

test('rejects goal withdrawals without a goal ID', () => {
    assert.throws(
        () => summarizeFinancialActuals({
            startDate,
            endDate,
            events: [
                {
                    type: 'goal_withdrawal',
                    amount: 100,
                    date: '2026-10-05'
                }
            ]
        }),
        /goal ID/
    );
});
