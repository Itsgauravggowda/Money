
const EVENT_TYPES = [
    'income',
    'expense',
    'debt_payment',
    'goal_withdrawal'
];

export function summarizeFinancialActuals({
    events,
    startDate,
    endDate
}) {
    if (!Array.isArray(events)) {
        throw new Error('events must be an array');
    }

    if (
        !(startDate instanceof Date) ||
        !(endDate instanceof Date) ||
        Number.isNaN(startDate.getTime()) ||
        Number.isNaN(endDate.getTime()) ||
        startDate >= endDate
    ) {
        throw new Error('A valid date range is required');
    }

    const summary = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        totalIncome: 0,
        totalExpenses: 0,
        totalDebtPayments: 0,
        totalGoalWithdrawals: 0,
        eventCount: events.length,
        goalWithdrawals: {}
    };

    for (const event of events) {
        if (!event || !EVENT_TYPES.includes(event.type)) {
            throw new Error('Invalid financial event in summary');
        }

        if (
            typeof event.amount !== 'number' ||
            !Number.isFinite(event.amount) ||
            event.amount <= 0
        ) {
            throw new Error('Event amount must be a positive number');
        }

        const eventDate = new Date(event.date);

        if (
            Number.isNaN(eventDate.getTime()) ||
            eventDate < startDate ||
            eventDate >= endDate
        ) {
            throw new Error('Event date is outside the requested range');
        }

        switch (event.type) {
            case 'income':
                summary.totalIncome += event.amount;
                break;

            case 'expense':
                summary.totalExpenses += event.amount;
                break;

            case 'debt_payment':
                summary.totalDebtPayments += event.amount;
                break;

            case 'goal_withdrawal':
                if (
                    typeof event.goalId !== 'string' ||
                    !event.goalId.trim()
                ) {
                    throw new Error(
                        'Goal withdrawal must include a goal ID'
                    );
                }

                summary.totalGoalWithdrawals += event.amount;

                summary.goalWithdrawals[event.goalId] =
                    (summary.goalWithdrawals[event.goalId] ?? 0) +
                    event.amount;
                break;
        }
    }

    summary.netRecordedCashFlow =
        summary.totalIncome -
        summary.totalExpenses -
        summary.totalDebtPayments;

    return summary;
}
