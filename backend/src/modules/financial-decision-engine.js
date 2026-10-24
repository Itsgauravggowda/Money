
import { createMonthlyPlan } from './monthly-planning.js';
import {
    calculateGoalCompletionMonths
} from './goal-feasibility.js';
const PROFILE_FIELDS = [
    'monthlyIncome',
    'essentialExpenses',
    'mandatoryDebtPayments',
    'currentEmergencyReserve',
    'emergencyReserveTarget'
];

const GOAL_FIELDS = [
    'targetAmount',
    'currentSavings',
    'monthsRemaining',
    'priority'
];

function validateInflationRate(rate) {
    if (
        typeof rate !== 'number' ||
        !Number.isFinite(rate) ||
        rate < 0 ||
        rate > 1
    ) {
        throw new Error(
            'annualInflationRate must be between 0 and 1'
        );
    }
}

function validateInputs(financialProfile, goals, scenario) {
    if (
        !financialProfile ||
        typeof financialProfile !== 'object' ||
        Array.isArray(financialProfile)
    ) {
        throw new Error('financialProfile is required');
    }

    for (const field of PROFILE_FIELDS) {
        if (
            typeof financialProfile[field] !== 'number' ||
            !Number.isFinite(financialProfile[field]) ||
            financialProfile[field] < 0
        ) {
            throw new Error(
                `${field} must be a non-negative number`
            );
        }
    }

    if (!Array.isArray(goals)) {
        throw new Error('goals must be an array');
    }

    for (const goal of goals) {
        if (!goal || typeof goal.id !== 'string') {
            throw new Error('Each goal must have a string id');
        }

        for (const field of [
            'targetAmount',
            'currentSavings',
            'monthsRemaining',
            'priority'
        ]) {
            if (
                typeof goal[field] !== 'number' ||
                !Number.isFinite(goal[field]) ||
                goal[field] < 0
            ) {
                throw new Error(
                    `${field} must be a non-negative number`
                );
            }
        }
    }

    if (
        !scenario ||
        typeof scenario !== 'object' ||
        Array.isArray(scenario)
    ) {
        throw new Error('scenario must be an object');
    }
}

function adjustGoalForInflation(goal, rate) {
    return {
        ...goal,
        targetAmount: Math.ceil(
            goal.targetAmount *
            Math.pow(1 + rate, goal.monthsRemaining / 12)
        )
    };
}

function buildPlan(profile, goals, inflationRate) {
    const adjustedGoals = goals.map(goal =>
        adjustGoalForInflation(goal, inflationRate)
    );

    const plan = createMonthlyPlan({
        financialProfile: profile,
        goals: adjustedGoals
    });

    return {
        ...plan,
        assumptions: {
            annualInflationRate: inflationRate,
            annualInflationPercent: inflationRate * 100
        },
        
goals: adjustedGoals.map(goal => {
    const feasibility = plan.feasibility.find(
        item => item.goalId === goal.id
    );

    return {
        id: goal.id,
        name: goal.name ?? goal.id,
        targetAmount: goal.targetAmount,
        currentSavings: goal.currentSavings,
        monthsRemaining: goal.monthsRemaining,
        priority: goal.priority,
        estimatedCompletionMonths:
            calculateGoalCompletionMonths({
                targetAmount: goal.targetAmount,
                currentSavings: goal.currentSavings,
                monthlyContribution:
                    feasibility?.allocatedContribution ?? 0
            })
    };
})

    };
}

function applyScenario(profile, goals, scenario) {
    const profileChanges = scenario.profileChanges ?? {};
    const goalChanges = scenario.goalChanges ?? [];

    if (
        !profileChanges ||
        typeof profileChanges !== 'object' ||
        Array.isArray(profileChanges)
    ) {
        throw new Error('profileChanges must be an object');
    }

    for (const field of Object.keys(profileChanges)) {
        if (!PROFILE_FIELDS.includes(field)) {
            throw new Error(
                `Scenario cannot change profile field "${field}"`
            );
        }
    }

    if (!Array.isArray(goalChanges)) {
        throw new Error('goalChanges must be an array');
    }

    const updatedProfile = {
        ...profile,
        ...profileChanges
    };

    const updatedGoals = goals.map(goal => ({ ...goal }));
    const changedIds = new Set();

    for (const change of goalChanges) {
        if (!change || typeof change.id !== 'string') {
            throw new Error(
                'Each goal change must include a goal id'
            );
        }

        if (changedIds.has(change.id)) {
            throw new Error(
                `Duplicate scenario change for goal "${change.id}"`
            );
        }

        changedIds.add(change.id);

        const goal = updatedGoals.find(
            item => item.id === change.id
        );

        if (!goal) {
            throw new Error(
                `Scenario goal "${change.id}" was not found`
            );
        }

        for (const field of Object.keys(change)) {
            if (field !== 'id' && !GOAL_FIELDS.includes(field)) {
                throw new Error(
                    `Scenario cannot change goal field "${field}"`
                );
            }
        }

        Object.assign(goal, change);
    }

    const oneTimeExpense = scenario.oneTimeExpense ?? 0;

    if (
        typeof oneTimeExpense !== 'number' ||
        !Number.isFinite(oneTimeExpense) ||
        oneTimeExpense < 0
    ) {
        throw new Error(
            'oneTimeExpense must be a non-negative number'
        );
    }

    const reserveBeforeShock =
        updatedProfile.currentEmergencyReserve;

    updatedProfile.currentEmergencyReserve = Math.max(
        0,
        reserveBeforeShock - oneTimeExpense
    );

    return {
        profile: updatedProfile,
        goals: updatedGoals,
        oneTimeExpense,
        uncoveredOneTimeExpense: Math.max(
            0,
            oneTimeExpense - reserveBeforeShock
        )
    };
}

function comparePlans(baseline, alternative) {
    const goalIds = new Set([
        ...baseline.feasibility.map(goal => goal.goalId),
        ...alternative.feasibility.map(goal => goal.goalId)
    ]);

    const goals = [...goalIds].map(goalId => {
        const before = baseline.feasibility.find(
            goal => goal.goalId === goalId
        );

        const after = alternative.feasibility.find(
            goal => goal.goalId === goalId
        );

        return {
            goalId,
            baseline: before ?? null,
            alternative: after ?? null,
            allocatedContributionChange:
                (after?.allocatedContribution ?? 0) -
                (before?.allocatedContribution ?? 0),
            projectedShortfallChange:
                (after?.projectedShortfall ?? 0) -
                (before?.projectedShortfall ?? 0)
        };
    });

    return {
        availableForGoalsChange:
            alternative.capacity.availableForGoals -
            baseline.capacity.availableForGoals,
        monthlySurplusChange:
            alternative.capacity.monthlySurplus -
            baseline.capacity.monthlySurplus,
        reserveShortfallChange:
            alternative.capacity.reserveShortfall -
            baseline.capacity.reserveShortfall,
        goals
    };
}

function createRecommendations(plan, uncoveredExpense) {
    const recommendations = [];

    if (plan.capacity.hasMonthlyDeficit) {
        recommendations.push(
            'Income does not cover essential expenses and mandatory debt payments. Review spending or income before allocating money to goals.'
        );
    }

    if (uncoveredExpense > 0) {
        recommendations.push(
            `The unexpected expense exceeds the emergency reserve by ${uncoveredExpense}. Decide how to cover the remaining amount.`
        );
    }

    if (plan.capacity.reserveShortfall > 0) {
        recommendations.push(
            `The emergency reserve is below its target by ${plan.capacity.reserveShortfall}.`
        );
    }

    if (plan.allocation.requiresDecision) {
        recommendations.push(
            plan.allocation.decisionReason ??
            'A decision is needed because available funds cannot satisfy competing goal contributions.'
        );
    }

    for (const goal of plan.feasibility) {
        if (goal.requiresDeadlineReview) {
            recommendations.push(
                `Goal ${goal.goalId} has reached its deadline and needs review.`
            );
        } else if (goal.projectedShortfall > 0) {
            recommendations.push(
                `Goal ${goal.goalId} has a projected shortfall of ${goal.projectedShortfall}. Review its deadline, priority, or target.`
            );
        }
    }

    if (recommendations.length === 0) {
        recommendations.push(
            'The current plan fits the modeled monthly capacity. Review actual results regularly and recalculate when assumptions change.'
        );
    }

    return recommendations;
}

export function evaluateFinancialScenario({
    financialProfile,
    goals,
    annualInflationRate = 0,
    scenario = {}
}) {
    validateInputs(financialProfile, goals, scenario);
    validateInflationRate(annualInflationRate);

    const scenarioInflationRate =
        scenario.annualInflationRate ?? annualInflationRate;

    validateInflationRate(scenarioInflationRate);

    const baseline = buildPlan(
        { ...financialProfile },
        goals.map(goal => ({ ...goal })),
        annualInflationRate
    );

    const applied = applyScenario(
        financialProfile,
        goals,
        scenario
    );

    const alternative = buildPlan(
        applied.profile,
        applied.goals,
        scenarioInflationRate
    );

    return {
        baseline,
        alternative,
        comparison: comparePlans(baseline, alternative),
        scenarioDetails: {
            oneTimeExpense: applied.oneTimeExpense,
            uncoveredOneTimeExpense:
                applied.uncoveredOneTimeExpense
        },
        recommendations: createRecommendations(
            alternative,
            applied.uncoveredOneTimeExpense
        )
    };
}
