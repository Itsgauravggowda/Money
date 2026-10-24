
import jwt from 'jsonwebtoken';

export function authenticateRequest(req) {
    const authorization = req.headers.authorization;

    if (
        typeof authorization !== 'string' ||
        !authorization.startsWith('Bearer ')
    ) {
        return {
            authenticated: false,
            statusCode: 401,
            message: 'Authentication token is required'
        };
    }

    const token = authorization.slice(7);
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error('JWT_SECRET is not configured');
    }

    try {
        const payload = jwt.verify(token, secret);

        if (
            typeof payload.sub !== 'string' ||
            payload.sub.length === 0
        ) {
            return {
                authenticated: false,
                statusCode: 401,
                message: 'Invalid authentication token'
            };
        }

        return {
            authenticated: true,
            userId: payload.sub
        };
    } catch (error) {
        if (error.name === 'JsonWebTokenError' ||
            error.name === 'TokenExpiredError' ||
            error.name === 'NotBeforeError') {
            return {
                authenticated: false,
                statusCode: 401,
                message: 'Invalid or expired authentication token'
            };
        }

        throw error;
    }
}
