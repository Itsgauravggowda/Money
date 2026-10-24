
export function validateGoal(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
        throw new Error('Goal details are required');
    }

    const {
        name,
        targetAmount,
        currentSavings,
        monthsRemaining,
        priority
    } = input;

    if (typeof name !== 'string' || name.trim().length === 0) {
        throw new Error('Goal name is required');
    }

    if (
        typeof targetAmount !== 'number' ||
        !Number.isFinite(targetAmount) ||
        targetAmount <= 0
    ) {
        throw new Error('Target amount must be a positive number');
    }

    if (
        typeof currentSavings !== 'number' ||
        !Number.isFinite(currentSavings) ||
        currentSavings < 0
    ) {
        throw new Error('Current savings must be a non-negative number');
    }

    if (
        !Number.isInteger(monthsRemaining) ||
        monthsRemaining < 0
    ) {
        throw new Error('Months remaining must be a non-negative integer');
    }

    if (!Number.isInteger(priority) || priority < 1) {
        throw new Error('Priority must be a positive integer');
    }

    return {
        name: name.trim(),
        targetAmount,
        currentSavings,
        monthsRemaining,
        priority
    };
}

export function validateGoalUpdate(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
        throw new Error('Goal update details are required');
    }

    const allowedFields = [
        'name',
        'targetAmount',
        'currentSavings',
        'monthsRemaining',
        'priority'
    ];

    const keys = Object.keys(input);

    if (keys.length === 0) {
        throw new Error('At least one goal field must be provided');
    }

    for (const key of keys) {
        if (!allowedFields.includes(key)) {
            throw new Error(`Field "${key}" cannot be updated`);
        }
    }

    const updatedGoal = {};

    if ('name' in input) {
        if (typeof input.name !== 'string' || input.name.trim().length === 0) {
            throw new Error('Goal name is required');
        }

        updatedGoal.name = input.name.trim();
    }

    if ('targetAmount' in input) {
        if (
            typeof input.targetAmount !== 'number' ||
            !Number.isFinite(input.targetAmount) ||
            input.targetAmount <= 0
        ) {
            throw new Error('Target amount must be a positive number');
        }

        updatedGoal.targetAmount = input.targetAmount;
    }

    if ('currentSavings' in input) {
        if (
            typeof input.currentSavings !== 'number' ||
            !Number.isFinite(input.currentSavings) ||
            input.currentSavings < 0
        ) {
            throw new Error('Current savings must be a non-negative number');
        }

        updatedGoal.currentSavings = input.currentSavings;
    }

    if ('monthsRemaining' in input) {
        if (
            !Number.isInteger(input.monthsRemaining) ||
            input.monthsRemaining < 0
        ) {
            throw new Error('Months remaining must be a non-negative integer');
        }

        updatedGoal.monthsRemaining = input.monthsRemaining;
    }

    if ('priority' in input) {
        if (!Number.isInteger(input.priority) || input.priority < 1) {
            throw new Error('Priority must be a positive integer');
        }

        updatedGoal.priority = input.priority;
    }

    return updatedGoal;
}
