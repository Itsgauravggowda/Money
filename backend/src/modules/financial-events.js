
const VALID_EVENT_TYPES = [
    'income',
    'expense',
    'debt_payment',
    'goal_withdrawal'
];

export function createFinancialEvent({
    type,
    amount,
    date,
    description,
    goalId = null
}) {
    if (!VALID_EVENT_TYPES.includes(type)) {
        throw new Error('Invalid financial event type');
    }

    if (
        typeof amount !== 'number' ||
        !Number.isFinite(amount) ||
        amount <= 0
    ) {
        throw new Error('amount must be a positive number');
    }

    if (
        typeof date !== 'string' ||
        Number.isNaN(Date.parse(date))
    ) {
        throw new Error('date must be a valid date string');
    }

    if (
        typeof description !== 'string' ||
        description.trim().length === 0
    ) {
        throw new Error('description is required');
    }

    if (type === 'goal_withdrawal') {
        if (
            typeof goalId !== 'string' ||
            goalId.trim().length === 0
        ) {
            throw new Error(
                'goalId is required for goal withdrawals'
            );
        }
    } else if (goalId !== null) {
        throw new Error(
            'goalId is only allowed for goal withdrawals'
        );
    }

    return {
        type,
        amount,
        date,
        description: description.trim(),
        goalId
    };
}
