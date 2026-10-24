
import { authenticateRequest } from '../middleware/auth-middleware.js';

import {
    createUserGoal,
    getUserGoals
} from '../services/goal-service.js';

export async function handleGoalRoutes(req, res, pathname) {
    const isCreate =
        req.method === 'POST' &&
        pathname === '/api/v1/goals';

    const isList =
        req.method === 'GET' &&
        pathname === '/api/v1/goals';

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

            result = await createUserGoal(auth.userId, input);
        } else {
            result = await getUserGoals(auth.userId);
        }

        res.writeHead(isCreate ? 201 : 200, {
            'Content-Type': 'application/json'
        });

        res.end(JSON.stringify({
            status: 'success',
            message: isCreate
                ? 'Goal created successfully'
                : 'Goals retrieved successfully',
            data: isCreate
                ? { goal: result }
                : { goals: result }
        }));

        return true;
    } catch (error) {
        const validationPrefixes = [
            'Goal details are required',
            'Goal name is required',
            'Target amount must',
            'Current savings must',
            'Months remaining must',
            'Priority must'
        ];

        const isValidationError = validationPrefixes.some(
            prefix => error.message.startsWith(prefix)
        );

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
            console.error('Goal API error:', error);
        }

        return true;
    }
}
