
import {
    getUserFinancialProfile
} from './financial-profile-service.js';

import {
    getUserGoals
} from './goal-service.js';

import {
    createMonthlyPlan
} from '../modules/monthly-planning.js';

export async function generateUserMonthlyPlan(userId) {
    const financialProfile =
        await getUserFinancialProfile(userId);

    if (!financialProfile) {
        throw new Error(
            'Financial profile must be created before generating a plan'
        );
    }

    const savedGoals = await getUserGoals(userId);

    const goals = savedGoals.map(goal => ({
        id: goal._id.toString(),
        targetAmount: goal.targetAmount,
        currentSavings: goal.currentSavings,
        monthsRemaining: goal.monthsRemaining,
        priority: goal.priority
    }));

    return createMonthlyPlan({
        financialProfile: {
            monthlyIncome: financialProfile.monthlyIncome,
            essentialExpenses: financialProfile.essentialExpenses,
            mandatoryDebtPayments:
                financialProfile.mandatoryDebtPayments,
            currentEmergencyReserve:
                financialProfile.currentEmergencyReserve,
            emergencyReserveTarget:
                financialProfile.emergencyReserveTarget
        },
        goals
    });
}
