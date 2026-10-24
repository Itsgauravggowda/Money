
import { authenticateRequest } from '../middleware/auth-middleware.js';

import {
    generateUserMonthlyPlan
} from '../services/monthly-planning-service.js';

export async function handleMonthlyPlanningRoutes(
    req,
    res,
    pathname
) {
    const isGenerate =
        req.method === 'GET' &&
        pathname === '/api/v1/plans/monthly';

    if (!isGenerate) {
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
        const plan = await generateUserMonthlyPlan(auth.userId);

        res.writeHead(200, {
            'Content-Type': 'application/json'
        });

        res.end(JSON.stringify({
            status: 'success',
            message: 'Monthly plan generated successfully',
            data: { plan }
        }));

        return true;
    } catch (error) {
        const needsProfile = error.message ===
            'Financial profile must be created before generating a plan';

        res.writeHead(needsProfile ? 400 : 500, {
            'Content-Type': 'application/json'
        });

        res.end(JSON.stringify({
            status: 'error',
            message: needsProfile
                ? error.message
                : 'Internal server error'
        }));

        if (!needsProfile) {
            console.error('Monthly planning API error:', error);
        }

        return true;
    }
}
