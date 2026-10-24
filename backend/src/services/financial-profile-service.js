
import {
    validateFinancialProfile
} from '../modules/financial-profile.js';

import {
    saveFinancialProfile,
    getFinancialProfile
} from '../repositories/financial-profile-repository.js';

export async function saveUserFinancialProfile(userId, input) {
    const profile = validateFinancialProfile(input);

    return saveFinancialProfile(userId, profile);
}

export async function getUserFinancialProfile(userId) {
    return getFinancialProfile(userId);
}
