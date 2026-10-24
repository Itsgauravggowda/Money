
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
