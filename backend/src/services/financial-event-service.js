
import { summarizeFinancialActuals } from '../modules/financial-actuals.js';

import { createFinancialEvent } from '../modules/financial-events.js';

import {
    saveFinancialEvent,
    getFinancialEvents,
    getFinancialEventsByDateRange
} from '../repositories/financial-event-repository.js';

export async function createUserFinancialEvent(userId, input) {
    const event = createFinancialEvent(input);

    return saveFinancialEvent(userId, event);
}

export async function getUserFinancialEvents(userId) {
    return getFinancialEvents(userId);
}

export async function getUserFinancialActuals(
    userId,
    startDate,
    endDate
) {
    const events = await getFinancialEventsByDateRange(
        userId,
        startDate,
        endDate
    );

    return summarizeFinancialActuals({
        events,
        startDate,
        endDate
    });
}
