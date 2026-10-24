
import { authenticateRequest } from '../middleware/auth-middleware.js';

import {
    createUserGoal,
    getUserGoals,
    updateUserGoal
} from '../services/goal-service.js';

export async function handleGoalRoutes(req, res, pathname) {
    const isCreate =
        req.method === 'POST' &&
        pathname === '/api/v1/goals';

    const isList =
        req.method === 'GET' &&
        pathname === '/api/v1/goals';

    const goalMatch = pathname.match(/^\/api\/v1\/goals\/([^/]+)$/);

    const isUpdate =
        req.method === 'PATCH' &&
        goalMatch !== null;

    if (!isCreate && !isList && !isUpdate) {
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

        if (isList) {
            result = await getUserGoals(auth.userId);
        } else {
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

            if (isCreate) {
                result = await createUserGoal(auth.userId, input);
            } else {
                result = await updateUserGoal(
                    auth.userId,
                    goalMatch[1],
                    input
                );
            }
        }

        res.writeHead(isCreate ? 201 : 200, {
            'Content-Type': 'application/json'
        });

        res.end(JSON.stringify({
            status: 'success',
            message: isCreate
                ? 'Goal created successfully'
                : isUpdate
                    ? 'Goal updated successfully'
                    : 'Goals retrieved successfully',
            data: isCreate || isUpdate
                ? { goal: result }
                : { goals: result }
        }));

        return true;
    } catch (error) {
        const validationPrefixes = [
            'Goal details are required',
            'Goal update details are required',
            'At least one goal field must be provided',
            'Field "',
            'Goal name is required',
            'Target amount must',
            'Current savings must',
            'Months remaining must',
            'Priority must',
            'A valid user ID and goal ID are required'
        ];

        const isValidationError = validationPrefixes.some(
            prefix => error.message.startsWith(prefix)
        );

        const isNotFound = error.message === 'Goal not found';

        const statusCode = isNotFound
            ? 404
            : isValidationError
                ? 400
                : 500;

        res.writeHead(statusCode, {
            'Content-Type': 'application/json'
        });

        res.end(JSON.stringify({
            status: 'error',
            message: isNotFound || isValidationError
                ? error.message
                : 'Internal server error'
        }));

        if (!isNotFound && !isValidationError) {
            console.error('Goal API error:', error);
        }

        return true;
    }
}
