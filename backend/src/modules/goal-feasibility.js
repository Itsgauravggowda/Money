
function validateNonNegativeNumber(name, value) {
    if (
        typeof value !== 'number' ||
        !Number.isFinite(value) ||
        value < 0
    ) {
        throw new Error(`${name} must be a non-negative number`);
    }
}

export function calculateGoalFeasibility({
    targetAmount,
    currentSavings,
    monthsRemaining,
    monthlyContributionCapacity
}) {
    validateNonNegativeNumber('targetAmount', targetAmount);
    validateNonNegativeNumber('currentSavings', currentSavings);
    validateNonNegativeNumber(
        'monthlyContributionCapacity',
        monthlyContributionCapacity
    );

    if (
        !Number.isInteger(monthsRemaining) ||
        monthsRemaining < 0
    ) {
        throw new Error(
            'monthsRemaining must be a non-negative integer'
        );
    }

    const remainingAmount = Math.max(
        0,
        targetAmount - currentSavings
    );

    const requiredMonthlyContribution =
    remainingAmount === 0
        ? 0
        : monthsRemaining === 0
            ? null
            : remainingAmount / monthsRemaining;

    const achievable =
        remainingAmount === 0 ||
        (
            monthsRemaining > 0 &&
            requiredMonthlyContribution <= monthlyContributionCapacity
        );

    const projectedAmount =
        currentSavings +
        monthlyContributionCapacity * monthsRemaining;

    const projectedShortfall = Math.max(
        0,
        targetAmount - projectedAmount
    );

    const deadlineStatus =
    remainingAmount === 0
        ? 'funded'
        : monthsRemaining === 0
            ? 'deadline_reached'
            : 'active';

return {
    remainingAmount,
    requiredMonthlyContribution,
    monthlyContributionCapacity,
    projectedAmount,
    projectedShortfall,
    achievable,
    deadlineStatus
};
}

export function calculateGoalCompletionMonths({
    targetAmount,
    currentSavings,
    monthlyContribution
}) {
    validateNonNegativeNumber('targetAmount', targetAmount);
    validateNonNegativeNumber('currentSavings', currentSavings);
    validateNonNegativeNumber(
        'monthlyContribution',
        monthlyContribution
    );

    const remainingAmount = Math.max(
        0,
        targetAmount - currentSavings
    );

    if (remainingAmount === 0) {
        return 0;
    }

    if (monthlyContribution === 0) {
        return null;
    }

    return Math.ceil(
        remainingAmount / monthlyContribution
    );
}
