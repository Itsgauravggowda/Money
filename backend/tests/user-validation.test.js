
import test from 'node:test';
import assert from 'node:assert/strict';

import {
    validateRegistration
} from '../src/modules/user-validation.js';

test('accepts valid registration details', () => {
    const result = validateRegistration({
        name: 'Gaurav Gowda',
        email: 'gaurav@example.com',
        password: 'securePass123'
    });

    assert.equal(result.name, 'Gaurav Gowda');
    assert.equal(result.email, 'gaurav@example.com');
    assert.equal(result.password, 'securePass123');
});

test('trims the name and normalizes the email', () => {
    const result = validateRegistration({
        name: '  Gaurav Gowda  ',
        email: '  GAURAV@EXAMPLE.COM  ',
        password: 'securePass123'
    });

    assert.equal(result.name, 'Gaurav Gowda');
    assert.equal(result.email, 'gaurav@example.com');
});

test('rejects a name that is too short', () => {
    assert.throws(
        () => validateRegistration({
            name: 'A',
            email: 'gaurav@example.com',
            password: 'securePass123'
        }),
        /Name must contain at least 2 characters/
    );
});

test('rejects an invalid email address', () => {
    assert.throws(
        () => validateRegistration({
            name: 'Gaurav Gowda',
            email: 'not-an-email',
            password: 'securePass123'
        }),
        /A valid email address is required/
    );
});

test('rejects a password shorter than 8 characters', () => {
    assert.throws(
        () => validateRegistration({
            name: 'Gaurav Gowda',
            email: 'gaurav@example.com',
            password: 'short'
        }),
        /Password must contain at least 8 characters/
    );
});
