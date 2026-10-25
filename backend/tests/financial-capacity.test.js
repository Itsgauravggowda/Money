
import test from 'node:test';
import assert from 'node:assert/strict';

import {
    calculateFinancialCapacity
} from '../src/modules/financial-capacity.js';

const profile = {
    monthlyIncome: 80000,
    essentialExpenses: 35000,
    mandatoryDebtPayments: 10000,
    currentEmergencyReserve: 40000,
    emergencyReserveTarget: 60000
};

test('calculates monthly surplus and funds the reserve before goals', () => {
    const result = calculateFinancialCapacity(profile);

    assert.equal(result.monthlySurplus, 35000);
    assert.equal(result.reserveShortfall, 20000);
    assert.equal(result.emergencyReserveContribution, 20000);
    assert.equal(result.availableForGoals, 15000);
    assert.equal(result.hasMonthlyDeficit, false);
    assert.equal(result.reserveFullyFunded, false);
});

test('allocates no money to goals when monthly finances have a deficit', () => {
    const result = calculateFinancialCapacity({
        monthlyIncome: 30000,
        essentialExpenses: 25000,
        mandatoryDebtPayments: 10000,
        currentEmergencyReserve: 50000,
        emergencyReserveTarget: 50000
    });

    assert.equal(result.monthlySurplus, -5000);
    assert.equal(result.emergencyReserveContribution, 0);
    assert.equal(result.availableForGoals, 0);
    assert.equal(result.hasMonthlyDeficit, true);
});

test('does not contribute to the reserve when monthly surplus is zero', () => {
    const result = calculateFinancialCapacity({
        monthlyIncome: 30000,
        essentialExpenses: 25000,
        mandatoryDebtPayments: 5000,
        currentEmergencyReserve: 2000,
        emergencyReserveTarget: 10000
    });

    assert.equal(result.monthlySurplus, 0);
    assert.equal(result.reserveShortfall, 8000);
    assert.equal(result.emergencyReserveContribution, 0);
    assert.equal(result.availableForGoals, 0);
    assert.equal(result.hasMonthlyDeficit, false);
    assert.equal(result.reserveFullyFunded, false);
});

test('uses only the surplus needed to complete the reserve', () => {
    const result = calculateFinancialCapacity({
        monthlyIncome: 40000,
        essentialExpenses: 25000,
        mandatoryDebtPayments: 5000,
        currentEmergencyReserve: 8000,
        emergencyReserveTarget: 10000
    });

    assert.equal(result.monthlySurplus, 10000);
    assert.equal(result.reserveShortfall, 2000);
    assert.equal(result.emergencyReserveContribution, 2000);
    assert.equal(result.availableForGoals, 8000);
    assert.equal(result.reserveFullyFunded, false);
});

test('marks the reserve fully funded when it exactly meets its target', () => {
    const result = calculateFinancialCapacity({
        monthlyIncome: 40000,
        essentialExpenses: 25000,
        mandatoryDebtPayments: 5000,
        currentEmergencyReserve: 10000,
        emergencyReserveTarget: 10000
    });

    assert.equal(result.reserveShortfall, 0);
    assert.equal(result.emergencyReserveContribution, 0);
    assert.equal(result.availableForGoals, 10000);
    assert.equal(result.reserveFullyFunded, true);
});

test('does not require further reserve contributions when reserve exceeds its target', () => {
    const result = calculateFinancialCapacity({
        monthlyIncome: 40000,
        essentialExpenses: 25000,
        mandatoryDebtPayments: 5000,
        currentEmergencyReserve: 15000,
        emergencyReserveTarget: 10000
    });

    assert.equal(result.reserveShortfall, 0);
    assert.equal(result.emergencyReserveContribution, 0);
    assert.equal(result.availableForGoals, 10000);
    assert.equal(result.reserveFullyFunded, true);
});

test('rejects negative financial inputs', () => {
    assert.throws(
        () => calculateFinancialCapacity({
            ...profile,
            monthlyIncome: -1000
        }),
        /monthlyIncome must be a non-negative number/
    );
});

test('rejects missing financial inputs', () => {
    assert.throws(
        () => calculateFinancialCapacity({
            monthlyIncome: 50000,
            essentialExpenses: 20000,
            mandatoryDebtPayments: 5000,
            currentEmergencyReserve: 10000
        }),
        /emergencyReserveTarget must be a non-negative number/
    );
});

test('rejects non-finite financial inputs', () => {
    assert.throws(
        () => calculateFinancialCapacity({
            ...profile,
            essentialExpenses: Infinity
        }),
        /essentialExpenses must be a non-negative number/
    );
});
