import { authenticateRequest } from '../middleware/auth-middleware.js';

import {
    createUserLiability,
    getUserLiabilities,
    updateUserLiability,
    deleteUserLiability
} from '../services/liability-service.js';

function sendJson(res, statusCode, payload) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(payload));
}

async function readJsonBody(req, res) {
    let body = '';

    for await (const chunk of req) {
        body += chunk;

        if (body.length > 1_000_000) {
            sendJson(res, 413, {
                status: 'error',
                message: 'Request body is too large'
            });
            return undefined;
        }
    }

    try {
        return JSON.parse(body);
    } catch {
        sendJson(res, 400, {
            status: 'error',
            message: 'Request body must contain valid JSON'
        });
        return undefined;
    }
}

export async function handleLiabilityRoutes(req, res, pathname) {
    const collectionPath = pathname === '/api/v1/liabilities';
    const match = pathname.match(/^\/api\/v1\/liabilities\/([^/]+)$/);

    const isCreate = req.method === 'POST' && collectionPath;
    const isList = req.method === 'GET' && collectionPath;
    const isUpdate = req.method === 'PATCH' && Boolean(match);
    const isDelete = req.method === 'DELETE' && Boolean(match);

    if (!isCreate && !isList && !isUpdate && !isDelete) return false;

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

        if (isList) {
            result = await getUserLiabilities(auth.userId);
            sendJson(res, 200, {
                status: 'success',
                message: 'Liabilities retrieved successfully',
                data: { liabilities: result }
            });
            return true;
        }

        if (isCreate || isUpdate) {
            const input = await readJsonBody(req, res);
            if (input === undefined) return true;

            result = isCreate
                ? await createUserLiability(auth.userId, input)
                : await updateUserLiability(auth.userId, match[1], input);

            sendJson(res, isCreate ? 201 : 200, {
                status: 'success',
                message: isCreate
                    ? 'Liability created successfully'
                    : 'Liability updated successfully',
                data: { liability: result }
            });
            return true;
        }

        await deleteUserLiability(auth.userId, match[1]);
        sendJson(res, 200, {
            status: 'success',
            message: 'Liability deleted successfully'
        });
        return true;
    } catch (error) {
        const validationPrefixes = [
            'Liability details are required',
            'Liability update details are required',
            'At least one liability field must be provided',
            'Field "',
            'Liability name must',
            'Liability type is invalid',
            'outstandingBalance must',
            'interestRate must',
            'minimumMonthlyPayment must',
            'dueDate must',
            'isActive must',
            'A valid user ID is required',
            'A valid liability ID is required'
        ];

        const isValidationError = validationPrefixes.some(
            prefix => error.message.startsWith(prefix)
        );
        const isNotFound = error.message === 'Liability not found';

        sendJson(res, isNotFound ? 404 : isValidationError ? 400 : 500, {
            status: 'error',
            message: isNotFound || isValidationError
                ? error.message
                : 'Internal server error'
        });

        if (!isNotFound && !isValidationError) {
            console.error('Liability API error:', error);
        }

        return true;
    }
}
