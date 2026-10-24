
import { authenticateRequest } from '../middleware/auth-middleware.js';

import {
    saveUserFinancialProfile,
    getUserFinancialProfile
} from '../services/financial-profile-service.js';

export async function handleFinancialProfileRoutes(req, res, pathname) {
    const isSave =
        req.method === 'PUT' &&
        pathname === '/api/v1/financial-profile';

    const isGet =
        req.method === 'GET' &&
        pathname === '/api/v1/financial-profile';

    if (!isSave && !isGet) {
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

        if (isSave) {
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

            result = await saveUserFinancialProfile(
                auth.userId,
                input
            );
        } else {
            result = await getUserFinancialProfile(auth.userId);
        }

        if (isGet && !result) {
            res.writeHead(404, {
                'Content-Type': 'application/json'
            });

            res.end(JSON.stringify({
                status: 'error',
                message: 'Financial profile not found'
            }));

            return true;
        }

        res.writeHead(isSave ? 200 : 200, {
            'Content-Type': 'application/json'
        });

        res.end(JSON.stringify({
            status: 'success',
            message: isSave
                ? 'Financial profile saved successfully'
                : 'Financial profile retrieved successfully',
            data: { financialProfile: result }
        }));

        return true;
    } catch (error) {
        const isValidationError = [
            'Financial profile details are required',
            'monthlyIncome must',
            'essentialExpenses must',
            'mandatoryDebtPayments must',
            'currentEmergencyReserve must',
            'emergencyReserveTarget must'
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
            console.error('Financial profile API error:', error);
        }

        return true;
    }
}
