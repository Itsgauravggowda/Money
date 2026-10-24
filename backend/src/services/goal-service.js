
import { validateGoal } from '../modules/goal-validation.js';

import {
    createGoal,
    getGoalsByUser
} from '../repositories/goal-repository.js';

export async function createUserGoal(userId, input) {
    const goal = validateGoal(input);

    return createGoal(userId, goal);
}

export async function getUserGoals(userId) {
    return getGoalsByUser(userId);
}
