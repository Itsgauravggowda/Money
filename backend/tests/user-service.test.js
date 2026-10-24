
import 'dotenv/config';

import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';

import {
    connectDatabase,
    closeDatabase
} from '../src/db/database.js';

import {
    registerUser
} from '../src/services/user-service.js';

test('registers a user and stores a hashed password', async () => {
    let db;
    let createdUser;

    const email = `test-${Date.now()}@example.com`;
    const password = 'securePass123';

    try {
        db = await connectDatabase();

        createdUser = await registerUser({
            name: 'Test User',
            email,
            password
        });

        assert.ok(createdUser.id);
        assert.equal(createdUser.name, 'Test User');
        assert.equal(createdUser.email, email);
        assert.equal('password' in createdUser, false);
        assert.equal('passwordHash' in createdUser, false);

        const storedUser = await db.collection('users').findOne({
            email
        });

        assert.ok(storedUser);
        assert.notEqual(storedUser.passwordHash, password);

        const passwordMatches = await bcrypt.compare(
            password,
            storedUser.passwordHash
        );

        assert.equal(passwordMatches, true);
    } finally {
        if (db && createdUser) {
            await db.collection('users').deleteOne({ email });
        }

        await closeDatabase();
    }
});

test('rejects registration when an email already exists', async () => {
    let db;
    let createdUser;

    const email = `duplicate-${Date.now()}@example.com`;

    try {
        db = await connectDatabase();

        createdUser = await registerUser({
            name: 'First User',
            email,
            password: 'securePass123'
        });

        await assert.rejects(
            registerUser({
                name: 'Second User',
                email,
                password: 'anotherPass123'
            }),
            /An account with this email already exists/
        );
    } finally {
        if (db && createdUser) {
            await db.collection('users').deleteOne({ email });
        }

        await closeDatabase();
    }
});
