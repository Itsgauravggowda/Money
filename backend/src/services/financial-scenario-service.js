
import {
    getUserFinancialProfile
} from './financial-profile-service.js';

import {
    getUserGoals
} from './goal-service.js';

import {
    evaluateFinancialScenario
} from '../modules/financial-decision-engine.js';

import {
    saveFinancialScenario
} from '../repositories/financial-scenario-repository.js';

export async function evaluateUserFinancialScenario(
    userId,
    input = {}
) {
    if (!userId) {
        throw new Error('userId is required');
    }

    if (!input || typeof input !== 'object' || Array.isArray(input)) {
        throw new Error('Scenario input must be an object');
    }

    const financialProfile =
        await getUserFinancialProfile(userId);

    if (!financialProfile) {
        throw new Error(
            'Financial profile must be created before evaluating a scenario'
        );
    }

    const savedGoals = await getUserGoals(userId);

    const goals = savedGoals.map(goal => ({
        id: goal._id.toString(),
        name: goal.name,
        targetAmount: goal.targetAmount,
        currentSavings: goal.currentSavings,
        monthsRemaining: goal.monthsRemaining,
        priority: goal.priority
    }));

    const result = evaluateFinancialScenario({
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
        goals,
        annualInflationRate: input.annualInflationRate ?? 0,
        scenario: input.scenario ?? {}
    });

    const saved = await saveFinancialScenario(
        userId,
        input,
        result
    );

    return {
        ...result,
        saved
    };
}
