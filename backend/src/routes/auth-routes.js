
import { registerUser } from '../services/user-service.js';
import { loginUser } from '../services/auth-service.js';

export async function handleAuthRoutes(req, res, pathname) {
    const isRegister =
        req.method === 'POST' &&
        pathname === '/api/v1/auth/register';

    const isLogin =
        req.method === 'POST' &&
        pathname === '/api/v1/auth/login';

    if (!isRegister && !isLogin) {
        return false;
    }

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

    try {
        const input = JSON.parse(body);

        const result = isRegister
            ? { user: await registerUser(input) }
            : await loginUser(input);

        res.writeHead(isRegister ? 201 : 200, {
            'Content-Type': 'application/json'
        });

        res.end(JSON.stringify({
            status: 'success',
            message: isRegister
                ? 'Account created successfully'
                : 'Login successful',
            data: result
        }));

        return true;
    } catch (error) {
        const duplicateEmail = error.code === 11000;
        const invalidJson = error instanceof SyntaxError;

        const validationError = [
            'Name must',
            'A valid email',
            'Password must',
            'Email and password are required'
        ].some(prefix => error.message.startsWith(prefix));

        const invalidCredentials =
            error.message === 'Invalid email or password';

        const statusCode = duplicateEmail
            ? 409
            : invalidJson || validationError
                ? 400
                : invalidCredentials
                    ? 401
                    : 500;

        res.writeHead(statusCode, {
            'Content-Type': 'application/json'
        });

        res.end(JSON.stringify({
            status: 'error',
            message: duplicateEmail
                ? 'An account with this email already exists'
                : invalidJson
                    ? 'Request body must contain valid JSON'
                    : validationError
                        ? error.message
                        : invalidCredentials
                            ? 'Invalid email or password'
                            : 'Internal server error'
        }));

        if (statusCode === 500) {
            console.error('Authentication error:', error);
        }

        return true;
    }
}
