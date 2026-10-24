
function validateAmount(name, value) {
    if (
        typeof value !== 'number' ||
        !Number.isFinite(value) ||
        value < 0
    ) {
        throw new Error(`${name} must be a non-negative number`);
    }
}

export function calculateFinancialCapacity({
    monthlyIncome,
    essentialExpenses,
    mandatoryDebtPayments,
    currentEmergencyReserve,
    emergencyReserveTarget
}) {
    const amounts = {
        monthlyIncome,
        essentialExpenses,
        mandatoryDebtPayments,
        currentEmergencyReserve,
        emergencyReserveTarget
    };

    for (const [name, value] of Object.entries(amounts)) {
        validateAmount(name, value);
    }

    const monthlySurplus =
        monthlyIncome -
        essentialExpenses -
        mandatoryDebtPayments;

    const reserveShortfall = Math.max(
        0,
        emergencyReserveTarget - currentEmergencyReserve
    );

    const availableBeforeReserve = Math.max(0, monthlySurplus);

    const emergencyReserveContribution = Math.min(
        availableBeforeReserve,
        reserveShortfall
    );

    const availableForGoals = Math.max(
        0,
        monthlySurplus - emergencyReserveContribution
    );

    return {
        monthlySurplus,
        reserveShortfall,
        emergencyReserveContribution,
        availableForGoals,
        hasMonthlyDeficit: monthlySurplus < 0,
        reserveFullyFunded:
            currentEmergencyReserve >= emergencyReserveTarget
    };
}
