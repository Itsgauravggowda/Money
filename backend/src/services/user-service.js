
import bcrypt from 'bcryptjs';
import { getDatabase } from '../db/database.js';
import { validateRegistration } from '../modules/user-validation.js';

export async function registerUser(input) {
    const validatedUser = validateRegistration(input);
    const db = getDatabase();

    const users = db.collection('users');

    const existingUser = await users.findOne({
        email: validatedUser.email
    });

    if (existingUser) {
        throw new Error('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(
        validatedUser.password,
        12
    );

    const userDocument = {
        name: validatedUser.name,
        email: validatedUser.email,
        passwordHash,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    const result = await users.insertOne(userDocument);

    return {
        id: result.insertedId.toString(),
        name: userDocument.name,
        email: userDocument.email,
        createdAt: userDocument.createdAt
    };
}
