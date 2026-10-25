
import { authenticateRequest } from '../middleware/auth-middleware.js';

import {
    createUserFinancialEvent,
    getUserFinancialEvents,
    getUserFinancialActuals
} from '../services/financial-event-service.js';

function sendJson(res, statusCode, payload) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json'
    });

    res.end(JSON.stringify(payload));
}

function isValidDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const date = new Date(`${value}T00:00:00.000Z`);

    return (
        !Number.isNaN(date.getTime()) &&
        date.toISOString().startsWith(value)
    );
}

export async function handleFinancialEventRoutes(req, res, pathname) {
    const isCreate =
        req.method === 'POST' &&
        pathname === '/api/v1/financial-events';

    const isList =
        req.method === 'GET' &&
        pathname === '/api/v1/financial-events';

    const isActuals =
        req.method === 'GET' &&
        pathname === '/api/v1/financial-events/actuals';

    if (!isCreate && !isList && !isActuals) {
        return false;
    }

    const auth = authenticateRequest(req);

    if (!auth.authenticated) {
        sendJson(res, auth.statusCode, {
            status: 'error',
            message: auth.message
        });

        return true;
    }

    try {
        let result;

        if (isCreate) {
            let body = '';

            for await (const chunk of req) {
                body += chunk;

                if (body.length > 1_000_000) {
                    sendJson(res, 413, {
                        status: 'error',
                        message: 'Request body is too large'
                    });

                    return true;
                }
            }

            let input;

            try {
                input = JSON.parse(body);
            } catch {
                sendJson(res, 400, {
                    status: 'error',
                    message: 'Request body must contain valid JSON'
                });

                return true;
            }

            result = await createUserFinancialEvent(
                auth.userId,
                input
            );
        } else if (isActuals) {
            const url = new URL(
                req.url,
                `http://${req.headers.host || 'localhost'}`
            );

            const startDateString = url.searchParams.get('startDate');
            const endDateString = url.searchParams.get('endDate');

            if (!startDateString || !endDateString) {
                sendJson(res, 400, {
                    status: 'error',
                    message: 'startDate and endDate are required'
                });

                return true;
            }

            if (
                !isValidDate(startDateString) ||
                !isValidDate(endDateString)
            ) {
                sendJson(res, 400, {
                    status: 'error',
                    message: 'Dates must use valid YYYY-MM-DD format'
                });

                return true;
            }

            const startDate = new Date(
                `${startDateString}T00:00:00.000Z`
            );

            const endDate = new Date(
                `${endDateString}T00:00:00.000Z`
            );

            if (startDate >= endDate) {
                sendJson(res, 400, {
                    status: 'error',
                    message: 'startDate must be before endDate'
                });

                return true;
            }

            result = await getUserFinancialActuals(
                auth.userId,
                startDate,
                endDate
            );
        } else {
            result = await getUserFinancialEvents(auth.userId);
        }

        sendJson(res, isCreate ? 201 : 200, {
            status: 'success',
            message: isCreate
                ? 'Financial event created successfully'
                : isActuals
                    ? 'Financial actuals retrieved successfully'
                    : 'Financial events retrieved successfully',
            data: isCreate
                ? { event: result }
                : isActuals
                    ? { actuals: result }
                    : { events: result }
        });

        return true;
    } catch (error) {
        const validationPrefixes = [
            'Invalid financial event type',
            'amount must',
            'date must',
            'description is required',
            'goalId is required',
            'goalId is only allowed',
            'A valid date range is required',
            'A valid user ID is required',
            'events must',
            'Invalid financial event',
            'Event amount must',
            'Event date is outside',
            'Goal withdrawal must'
        ];

        const isValidationError = validationPrefixes.some(
            prefix => error.message.startsWith(prefix)
        );

        sendJson(res, isValidationError ? 400 : 500, {
            status: 'error',
            message: isValidationError
                ? error.message
                : 'Internal server error'
        });

        if (!isValidationError) {
            console.error('Financial event error:', error);
        }

        return true;
    }
}
