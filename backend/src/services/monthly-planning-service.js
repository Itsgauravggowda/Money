
import {
    getUserFinancialProfile
} from './financial-profile-service.js';

import {
    getUserGoals
} from './goal-service.js';

import {
    getUserLiabilities
} from './liability-service.js';

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

    const [savedGoals, savedLiabilities] = await Promise.all([
        getUserGoals(userId),
        getUserLiabilities(userId)
    ]);

    const goals = savedGoals.map(goal => ({
        id: goal._id.toString(),
        targetAmount: goal.targetAmount,
        currentSavings: goal.currentSavings,
        monthsRemaining: goal.monthsRemaining,
        priority: goal.priority
    }));

    // Return active liability details without deducting payments again.
    const liabilities = savedLiabilities
        .filter(liability => liability.isActive)
        .map(liability => ({
            id: liability._id.toString(),
            name: liability.name,
            type: liability.type,
            outstandingBalance: liability.outstandingBalance,
            interestRate: liability.interestRate,
            minimumMonthlyPayment:
                liability.minimumMonthlyPayment,
            dueDate: liability.dueDate
        }));

    const plan = createMonthlyPlan({
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

    return {
        ...plan,
        liabilities
    };
}
