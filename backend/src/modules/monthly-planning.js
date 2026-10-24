
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

    const baseFeasibility = goals.map(goal => ({
        goalId: goal.id,
        ...calculateGoalFeasibility({
            targetAmount: goal.targetAmount,
            currentSavings: goal.currentSavings,
            monthsRemaining: goal.monthsRemaining,
            monthlyContributionCapacity:
                capacity.availableForGoals
        })
    }));

    
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
                const goalFeasibility = baseFeasibility.find(
                    item => item.goalId === goal.id
                );

                return {
                    id: goal.id,
                    priority: goal.priority,
                    requiredContribution:
                        goalFeasibility.deadlineStatus === 'deadline_reached'
                            ? 0
                            : goalFeasibility.requiredMonthlyContribution
                };
            })
        });


    
    const feasibility = baseFeasibility.map(item => {
        const allocated = allocation.allocations.find(
            entry => entry.goalId === item.goalId
        );

        const requiresDeadlineReview =
            item.deadlineStatus === 'deadline_reached';

        return {
            ...item,
            allocatedContribution:
                allocated?.allocatedContribution ?? 0,
            allocationShortfall: requiresDeadlineReview
                ? null
                : allocated?.shortfall ?? item.requiredMonthlyContribution,
            requiresDeadlineReview
        };
    });


    return {
        capacity,
        feasibility,
        allocation
    };
}
