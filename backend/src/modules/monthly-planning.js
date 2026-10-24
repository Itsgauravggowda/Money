
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

    const feasibility = goals.map(goal => ({
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
            goals: goals.map(goal => ({
                id: goal.id,
                priority: goal.priority,
                requiredContribution:
                    feasibility.find(
                        item => item.goalId === goal.id
                    ).requiredMonthlyContribution
            }))
        });

    return {
        capacity,
        feasibility,
        allocation
    };
}
