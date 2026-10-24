
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { getDatabase } from '../db/database.js';

export async function loginUser({ email, password }) {
    if (
        typeof email !== 'string' ||
        typeof password !== 'string' ||
        !email.trim() ||
        !password
    ) {
        throw new Error('Email and password are required');
    }

    const db = getDatabase();

    const user = await db.collection('users').findOne({
        email: email.trim().toLowerCase()
    });

    if (!user) {
        throw new Error('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(
        password,
        user.passwordHash
    );

    if (!passwordMatches) {
        throw new Error('Invalid email or password');
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error('JWT_SECRET is not configured');
    }

    const token = jwt.sign(
        { sub: user._id.toString() },
        secret,
        { expiresIn: '1h' }
    );

    return {
        token,
        user: {
            id: user._id.toString(),
            name: user.name,
            email: user.email
        }
    };
}
