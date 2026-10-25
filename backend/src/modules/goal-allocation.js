
function validateGoals(goals) {
    if (!Array.isArray(goals)) {
        throw new Error('goals must be an array');
    }

    const ids = new Set();

    for (const goal of goals) {
        if (
            !goal ||
            typeof goal !== 'object' ||
            Array.isArray(goal)
        ) {
            throw new Error('Each goal must be an object');
        }

        if (typeof goal.id !== 'string' || !goal.id.trim()) {
            throw new Error('Each goal must have a string id');
        }

        if (ids.has(goal.id)) {
            throw new Error(`Duplicate goal id: ${goal.id}`);
        }

        ids.add(goal.id);

        if (
            typeof goal.requiredContribution !== 'number' ||
            !Number.isFinite(goal.requiredContribution) ||
            goal.requiredContribution < 0
        ) {
            throw new Error(
                `Invalid required contribution for goal ${goal.id}`
            );
        }

        if (
            !Number.isInteger(goal.priority) ||
            goal.priority < 1
        ) {
            throw new Error(
                `Priority for goal ${goal.id} must be a positive integer`
            );
        }
    }
}

export function allocateGoalContributions({
    availableForGoals,
    goals
}) {
    if (
        typeof availableForGoals !== 'number' ||
        !Number.isFinite(availableForGoals) ||
        availableForGoals < 0
    ) {
        throw new Error(
            'availableForGoals must be a non-negative number'
        );
    }

    validateGoals(goals);

    const allocations = goals.map(goal => ({
        goalId: goal.id,
        priority: goal.priority,
        requestedContribution: goal.requiredContribution,
        allocatedContribution: 0,
        shortfall: goal.requiredContribution
    }));

    let remaining = availableForGoals;

    const priorities = [...new Set(
        goals.map(goal => goal.priority)
    )].sort((a, b) => a - b);

    for (const priority of priorities) {
        const group = allocations.filter(
            allocation => allocation.priority === priority
        );

        // Goals requiring no contribution are already satisfied for
        // this month's allocation and must not create a funding conflict.
        const activeGroup = group.filter(
            allocation => allocation.requestedContribution > 0
        );

        if (activeGroup.length === 0) {
            continue;
        }

        const groupRequired = activeGroup.reduce(
            (total, allocation) =>
                total + allocation.requestedContribution,
            0
        );

        if (groupRequired > remaining) {
            if (activeGroup.length > 1) {
                return {
                    allocations,
                    unallocatedAmount: remaining,
                    requiresDecision: true,
                    decisionReason:
                        'Available money cannot fully fund all goals at the same priority level.'
                };
            }

            const allocation = activeGroup[0];

            allocation.allocatedContribution = remaining;
            allocation.shortfall = Math.max(
                0,
                allocation.requestedContribution - remaining
            );

            remaining = 0;
            break;
        }

        for (const allocation of activeGroup) {
            allocation.allocatedContribution =
                allocation.requestedContribution;

            allocation.shortfall = 0;
        }

        remaining -= groupRequired;
    }

    return {
        allocations,
        unallocatedAmount: remaining,
        requiresDecision: false,
        decisionReason: null
    };
}
