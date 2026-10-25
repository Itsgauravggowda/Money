
import {
    calculateFinancialCapacity
} from './financial-capacity.js';

import {
    allocateGoalContributions
} from './goal-allocation.js';

import {
    calculateGoalFeasibility
} from './goal-feasibility.js';

export function createMonthlyPlan({
    financialProfile,
    goals
}) {
    const capacity = calculateFinancialCapacity(
        financialProfile
    );

    if (!Array.isArray(goals)) {
        throw new Error('goals must be an array');
    }

    const goalIds = new Set();

    for (const goal of goals) {
        if (!goal || typeof goal.id !== 'string' || !goal.id) {
            throw new Error('Each goal must have a string id');
        }

        if (goalIds.has(goal.id)) {
            throw new Error(`Duplicate goal id "${goal.id}"`);
        }

        goalIds.add(goal.id);
    }

    // Calculate each goal's required monthly contribution.
    const initialFeasibility = goals.map(goal => ({
        goalId: goal.id,
        ...calculateGoalFeasibility({
            targetAmount: goal.targetAmount,
            currentSavings: goal.currentSavings,
            monthsRemaining: goal.monthsRemaining,
            monthlyContributionCapacity:
                capacity.availableForGoals
        })
    }));

    // Allocate the available money according to priority.
    const allocation = capacity.hasMonthlyDeficit
        ? {
            allocations: [],
            unallocatedAmount: 0,
            requiresDecision: false,
            decisionReason: null
        }
        : allocateGoalContributions({
            availableForGoals: capacity.availableForGoals,
            goals: goals.map(goal => {
                const feasibility = initialFeasibility.find(
                    item => item.goalId === goal.id
                );

                return {
                    id: goal.id,
                    priority: goal.priority,
                    requiredContribution:
                        feasibility.deadlineStatus === 'deadline_reached'
                            ? 0
                            : feasibility.requiredMonthlyContribution
                };
            })
        });

    // Recalculate feasibility using the actual allocation.
    const feasibility = initialFeasibility.map(initial => {
        const goal = goals.find(
            item => item.id === initial.goalId
        );

        const allocated = allocation.allocations.find(
            item => item.goalId === initial.goalId
        );

        const allocatedContribution =
            allocated?.allocatedContribution ?? 0;

        if (initial.deadlineStatus === 'deadline_reached') {
            return {
                ...initial,
                allocatedContribution: 0,
                allocationShortfall: null,
                requiresDeadlineReview: true
            };
        }

        const actualFeasibility = calculateGoalFeasibility({
            targetAmount: goal.targetAmount,
            currentSavings: goal.currentSavings,
            monthsRemaining: goal.monthsRemaining,
            monthlyContributionCapacity: allocatedContribution
        });

        return {
            ...actualFeasibility,
            goalId: goal.id,
            allocatedContribution,
            allocationShortfall: Math.max(
                0,
                initial.requiredMonthlyContribution -
                    allocatedContribution
            ),
            requiresDeadlineReview: false
        };
    });

    return {
        capacity,
        feasibility,
        allocation
    };
}
