
import { authenticateRequest } from '../middleware/auth-middleware.js';

import {
    createUserFinancialEvent,
    getUserFinancialEvents
} from '../services/financial-event-service.js';

export async function handleFinancialEventRoutes(req, res, pathname) {
    const isCreate =
        req.method === 'POST' &&
        pathname === '/api/v1/financial-events';

    const isList =
        req.method === 'GET' &&
        pathname === '/api/v1/financial-events';

    if (!isCreate && !isList) {
        return false;
    }

    const auth = authenticateRequest(req);

    if (!auth.authenticated) {
        res.writeHead(auth.statusCode, {
            'Content-Type': 'application/json'
        });

        res.end(JSON.stringify({
            status: 'error',
            message: auth.message
        }));

        return true;
    }

    try {
        let result;

        if (isCreate) {
            let body = '';

            for await (const chunk of req) {
                body += chunk;

                if (body.length > 1_000_000) {
                    res.writeHead(413, {
                        'Content-Type': 'application/json'
                    });

                    res.end(JSON.stringify({
                        status: 'error',
                        message: 'Request body is too large'
                    }));

                    return true;
                }
            }

            let input;

            try {
                input = JSON.parse(body);
            } catch {
                res.writeHead(400, {
                    'Content-Type': 'application/json'
                });

                res.end(JSON.stringify({
                    status: 'error',
                    message: 'Request body must contain valid JSON'
                }));

                return true;
            }

            result = await createUserFinancialEvent(
                auth.userId,
                input
            );
        } else {
            result = await getUserFinancialEvents(auth.userId);
        }

        res.writeHead(isCreate ? 201 : 200, {
            'Content-Type': 'application/json'
        });

        res.end(JSON.stringify({
            status: 'success',
            message: isCreate
                ? 'Financial event created successfully'
                : 'Financial events retrieved successfully',
            data: isCreate
                ? { event: result }
                : { events: result }
        }));

        return true;
    } catch (error) {
        const isValidationError = [
            'Invalid financial event type',
            'amount must',
            'date must',
            'description is required',
            'goalId is required',
            'goalId is only allowed'
        ].some(prefix => error.message.startsWith(prefix));

        res.writeHead(isValidationError ? 400 : 500, {
            'Content-Type': 'application/json'
        });

        res.end(JSON.stringify({
            status: 'error',
            message: isValidationError
                ? error.message
                : 'Internal server error'
        }));

        if (!isValidationError) {
            console.error('Financial event error:', error);
        }

        return true;
    }
}
