
import { authenticateRequest } from '../middleware/auth-middleware.js';
import { getFinancialScenariosByUser } from '../repositories/financial-scenario-repository.js';

export async function handleSavedScenarioRoutes(req, res, pathname) {
    if (
        req.method !== 'GET' ||
        pathname !== '/api/v1/plans/scenarios'
    ) {
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
        const scenarios = await getFinancialScenariosByUser(auth.userId);

        res.writeHead(200, {
            'Content-Type': 'application/json'
        });

        res.end(JSON.stringify({
            status: 'success',
            message: 'Saved financial scenarios retrieved successfully',
            data: {
                scenarios: scenarios.map(scenario => ({
                    id: scenario._id.toString(),
                    input: scenario.input,
                    result: scenario.result,
                    createdAt: scenario.createdAt
                }))
            }
        }));
    } catch (error) {
        console.error('Saved scenario retrieval error:', error);

        res.writeHead(500, {
            'Content-Type': 'application/json'
        });

        res.end(JSON.stringify({
            status: 'error',
            message: 'Unable to retrieve saved scenarios'
        }));
    }

    return true;
}
