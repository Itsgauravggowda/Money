
import { createFinancialEvent } from '../modules/financial-events.js';
import {
    saveFinancialEvent,
    getFinancialEvents
} from '../repositories/financial-event-repository.js';

export async function createUserFinancialEvent(userId, input) {
    const event = createFinancialEvent(input);

    return saveFinancialEvent(userId, event);
}

export async function getUserFinancialEvents(userId) {
    return getFinancialEvents(userId);
}
