
const REQUIRED_FIELDS = [
    'monthlyIncome',
    'essentialExpenses',
    'mandatoryDebtPayments',
    'currentEmergencyReserve',
    'emergencyReserveTarget'
];

export function validateFinancialProfile(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
        throw new Error('Financial profile details are required');
    }

    const profile = {};

    for (const field of REQUIRED_FIELDS) {
        const value = input[field];

        if (
            typeof value !== 'number' ||
            !Number.isFinite(value) ||
            value < 0
        ) {
            throw new Error(
                `${field} must be a non-negative number`
            );
        }

        profile[field] = value;
    }

    return profile;
}
