
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { handleFinancialProfileRoutes } from '../src/routes/financial-profile-routes.js';

function createResponse() {
    return {
        statusCode: null,
        headers: {},
        body: '',

        writeHead(statusCode, headers) {
            this.statusCode = statusCode;
            this.headers = headers;
        },

        end(body = '') {
            this.body = body;
        }
    };
}

test('ignores requests for other routes', async () => {
    const req = { method: 'GET' };
    const res = createResponse();

    const handled = await handleFinancialProfileRoutes(
        req,
        res,
        '/api/v1/goals'
    );

    assert.equal(handled, false);
    assert.equal(res.statusCode, null);
});

test('rejects unauthenticated profile requests', async () => {
    const req = {
        method: 'GET',
        headers: {}
    };

    const res = createResponse();

    const handled = await handleFinancialProfileRoutes(
        req,
        res,
        '/api/v1/financial-profile'
    );

    assert.equal(handled, true);
    assert.equal(res.statusCode, 401);

    assert.match(
        res.body,
        /Authentication token is required/
    );
});

test('rejects unauthenticated profile updates', async () => {
    const req = {
        method: 'PUT',
        headers: {},
        async *[Symbol.asyncIterator]() {
            yield '{"monthlyIncome":50000}';
        }
    };

    const res = createResponse();

    const handled = await handleFinancialProfileRoutes(
        req,
        res,
        '/api/v1/financial-profile'
    );

    assert.equal(handled, true);
    assert.equal(res.statusCode, 401);
});
