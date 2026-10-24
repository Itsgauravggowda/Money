
import test from 'node:test';
import assert from 'node:assert/strict';

import {
    calculateFinancialCapacity
} from '../src/modules/financial-capacity.js';

test('calculates available money after expenses and reserve contribution', () => {
    const result = calculateFinancialCapacity({
        monthlyIncome: 80000,
        essentialExpenses: 35000,
        mandatoryDebtPayments: 10000,
        currentEmergencyReserve: 40000,
        emergencyReserveTarget: 60000
    });

    assert.equal(result.monthlySurplus, 35000);
    assert.equal(result.reserveShortfall, 20000);
    assert.equal(result.emergencyReserveContribution, 20000);
    assert.equal(result.availableForGoals, 15000);
    assert.equal(result.hasMonthlyDeficit, false);
});

test('does not allocate money to goals when monthly finances have a deficit', () => {
    const result = calculateFinancialCapacity({
        monthlyIncome: 30000,
        essentialExpenses: 25000,
        mandatoryDebtPayments: 10000,
        currentEmergencyReserve: 50000,
        emergencyReserveTarget: 50000
    });

    assert.equal(result.monthlySurplus, -5000);
    assert.equal(result.availableForGoals, 0);
    assert.equal(result.hasMonthlyDeficit, true);
});

test('rejects negative financial inputs', () => {
    assert.throws(
        () => calculateFinancialCapacity({
            monthlyIncome: -1000,
            essentialExpenses: 1000,
            mandatoryDebtPayments: 0,
            currentEmergencyReserve: 0,
            emergencyReserveTarget: 10000
        }),
        /monthlyIncome must be a non-negative number/
    );
});
