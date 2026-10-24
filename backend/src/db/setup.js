
import { getDatabase } from './database.js';

export async function setupDatabase() {
    const db = getDatabase();

    await db.collection('users').createIndex(
        { email: 1 },
        {
            unique: true,
            name: 'unique_user_email'
        }
    );

    console.log('Database indexes configured');
}
