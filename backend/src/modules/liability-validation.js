const LIABILITY_TYPES = [
    'education_loan',
    'personal_loan',
    'home_loan',
    'vehicle_loan',
    'credit_card',
    'other'
];

const ALLOWED_FIELDS = [
    'name',
    'type',
    'outstandingBalance',
    'interestRate',
    'minimumMonthlyPayment',
    'dueDate',
    'isActive'
];

function validateName(name) {
    if (typeof name !== 'string' || name.trim().length < 2) {
        throw new Error('Liability name must contain at least 2 characters');
    }

    return name.trim();
}

function validateType(type) {
    if (!LIABILITY_TYPES.includes(type)) {
        throw new Error('Liability type is invalid');
    }

    return type;
}

function validateAmount(field, value) {
    if (
        typeof value !== 'number' ||
        !Number.isFinite(value) ||
        value < 0
    ) {
        throw new Error(`${field} must be a non-negative number`);
    }

    return value;
}

function validateInterestRate(value) {
    if (
        typeof value !== 'number' ||
        !Number.isFinite(value) ||
        value < 0 ||
        value > 100
    ) {
        throw new Error('interestRate must be between 0 and 100');
    }

    return value;
}

function validateDueDate(value) {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new Error('dueDate must be a valid YYYY-MM-DD date or null');
    }

    const date = new Date(`${value}T00:00:00.000Z`);

    if (
        Number.isNaN(date.getTime()) ||
        date.toISOString().slice(0, 10) !== value
    ) {
        throw new Error('dueDate must be a valid YYYY-MM-DD date or null');
    }

    return value;
}

function validateIsActive(value) {
    if (typeof value !== 'boolean') {
        throw new Error('isActive must be a boolean');
    }

    return value;
}

export function validateLiability(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
        throw new Error('Liability details are required');
    }

    return {
        name: validateName(input.name),
        type: validateType(input.type),
        outstandingBalance: validateAmount(
            'outstandingBalance',
            input.outstandingBalance
        ),
        interestRate: validateInterestRate(input.interestRate),
        minimumMonthlyPayment: validateAmount(
            'minimumMonthlyPayment',
            input.minimumMonthlyPayment
        ),
        dueDate: validateDueDate(input.dueDate),
        isActive: input.isActive === undefined
            ? true
            : validateIsActive(input.isActive)
    };
}

export function validateLiabilityUpdate(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
        throw new Error('Liability update details are required');
    }

    const keys = Object.keys(input);

    if (keys.length === 0) {
        throw new Error('At least one liability field must be provided');
    }

    const updates = {};

    for (const key of keys) {
        if (!ALLOWED_FIELDS.includes(key)) {
            throw new Error(`Field "${key}" cannot be updated`);
        }
    }

    if ('name' in input) updates.name = validateName(input.name);
    if ('type' in input) updates.type = validateType(input.type);
    if ('outstandingBalance' in input) {
        updates.outstandingBalance = validateAmount(
            'outstandingBalance',
            input.outstandingBalance
        );
    }
    if ('interestRate' in input) {
        updates.interestRate = validateInterestRate(input.interestRate);
    }
    if ('minimumMonthlyPayment' in input) {
        updates.minimumMonthlyPayment = validateAmount(
            'minimumMonthlyPayment',
            input.minimumMonthlyPayment
        );
    }
    if ('dueDate' in input) updates.dueDate = validateDueDate(input.dueDate);
    if ('isActive' in input) updates.isActive = validateIsActive(input.isActive);

    return updates;
}
