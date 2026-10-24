import {
    validateGoal,
    validateGoalUpdate
} from '../modules/goal-validation.js';

import {
    createGoal,
    getGoalsByUser,
    updateGoalByUser
} from '../repositories/goal-repository.js';

export async function createUserGoal(userId, input) {
    const goal = validateGoal(input);

    return createGoal(userId, goal);
}

export async function getUserGoals(userId) {
    return getGoalsByUser(userId);
}


export async function updateUserGoal(userId, goalId, input) {
    const updates = validateGoalUpdate(input);

    const updatedGoal = await updateGoalByUser(
        userId,
        goalId,
        updates
    );

    if (!updatedGoal) {
        throw new Error('Goal not found');
    }

    return updatedGoal;
}
