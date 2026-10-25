
import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import jwt from 'jsonwebtoken';

import { handleLiabilityRoutes } from '../src/routes/liability-routes.js';

const TEST_SECRET = 'liability-route-test-secret';
process.env.JWT_SECRET = TEST_SECRET;

function createRequest(method, pathname, token, body = '') {
    const req = new EventEmitter();

    req.method = method;
    req.url = pathname;
    req.headers = {};

    if (token) {
        req.headers.authorization = `Bearer ${token}`;
    }

    // Make the request compatible with for-await...of body parsing.
    req[Symbol.asyncIterator] = async function* () {
        if (body) {
            yield Buffer.from(body);
        }
    };

    return req;
}

function createResponse() {
    return {
        statusCode: null,
        headers: {},
        body: '',

        writeHead(statusCode, headers = {}) {
            this.statusCode = statusCode;
            this.headers = headers;
        },

        end(body = '') {
            this.body = body;
        }
    };
}

function createToken(userId = '507f1f77bcf86cd799439011') {
    return jwt.sign(
        { sub: userId },
        TEST_SECRET,
        { expiresIn: '5m' }
    );
}

async function callRoute(method, pathname, token, body = '') {
    const req = createRequest(method, pathname, token, body);
    const res = createResponse();

    const handled = await handleLiabilityRoutes(req, res, pathname);

    let responseBody = null;

    if (res.body) {
        try {
            responseBody = JSON.parse(res.body);
        } catch {
            responseBody = res.body;
        }
    }

    return {
        handled,
        statusCode: res.statusCode,
        body: responseBody
    };
}

test('liability routes reject requests without authentication', async () => {
    const result = await callRoute(
        'GET',
        '/api/v1/liabilities',
        null
    );

    assert.equal(result.handled, true);
    assert.equal(result.statusCode, 401);
});

test('liability routes reject an invalid authentication token', async () => {
    const result = await callRoute(
        'GET',
        '/api/v1/liabilities',
        'invalid-token'
    );

    assert.equal(result.handled, true);
    assert.equal(result.statusCode, 401);
});

test('liability update rejects an invalid liability ID', async () => {
    const token = createToken();

    const result = await callRoute(
        'PATCH',
        '/api/v1/liabilities/invalid-id',
        token,
        JSON.stringify({ name: 'Updated liability' })
    );

    assert.equal(result.handled, true);
    assert.equal(result.statusCode, 400);
});

test('liability delete rejects an invalid liability ID', async () => {
    const token = createToken();

    const result = await callRoute(
        'DELETE',
        '/api/v1/liabilities/invalid-id',
        token
    );

    assert.equal(result.handled, true);
    assert.equal(result.statusCode, 400);
});

test('unknown routes are not handled by the liability router', async () => {
    const result = await callRoute(
        'GET',
        '/api/v1/not-a-liability-route',
        createToken()
    );

    assert.equal(result.handled, false);
});
