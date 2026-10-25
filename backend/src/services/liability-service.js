import {
    validateLiability,
    validateLiabilityUpdate
} from '../modules/liability-validation.js';

import {
    createLiability,
    getLiabilitiesByUser,
    updateLiabilityByUser,
    deleteLiabilityByUser
} from '../repositories/liability-repository.js';

export async function createUserLiability(userId, input) {
    return createLiability(userId, validateLiability(input));
}

export async function getUserLiabilities(userId) {
    return getLiabilitiesByUser(userId);
}

export async function updateUserLiability(userId, liabilityId, input) {
    const updates = validateLiabilityUpdate(input);
    const liability = await updateLiabilityByUser(userId, liabilityId, updates);

    if (!liability) throw new Error('Liability not found');

    return liability;
}

export async function deleteUserLiability(userId, liabilityId) {
    const deleted = await deleteLiabilityByUser(userId, liabilityId);

    if (!deleted) throw new Error('Liability not found');

    return true;
}
