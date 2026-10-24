
import { authenticateRequest } from '../middleware/auth-middleware.js';

import {
    evaluateUserFinancialScenario
} from '../services/financial-scenario-service.js';

export async function handleFinancialScenarioRoutes(
    req,
    res,
    pathname
) {
    const matches =
        req.method === 'POST' &&
        pathname === '/api/v1/plans/scenario';

    if (!matches) {
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

        const result = await evaluateUserFinancialScenario(
            auth.userId,
            input
        );

        res.writeHead(200, {
            'Content-Type': 'application/json'
        });

        res.end(JSON.stringify({
            status: 'success',
            message: 'Financial scenario evaluated successfully',
            data: { result }
        }));

        return true;
    } catch (error) {
        const clientErrors = [
            'userId is required',
            'Scenario input must be an object',
            'Financial profile must be created before evaluating a scenario',
            'financialProfile is required',
            'goals must be an array',
            'scenario must be an object',
            'profileChanges must be an object',
            'goalChanges must be an array',
            'oneTimeExpense must be a non-negative number',
            'annualInflationRate must be between 0 and 1'
        ];

        const isClientError =
            clientErrors.includes(error.message) ||
            /must be a non-negative number/.test(error.message) ||
            /Each goal|Each goal change|Duplicate scenario change|Scenario cannot change|Scenario goal/.test(error.message);

        res.writeHead(isClientError ? 400 : 500, {
            'Content-Type': 'application/json'
        });

        res.end(JSON.stringify({
            status: 'error',
            message: isClientError
                ? error.message
                : 'Internal server error'
        }));

        if (!isClientError) {
            console.error('Financial scenario API error:', error);
        }

        return true;
    }
}
