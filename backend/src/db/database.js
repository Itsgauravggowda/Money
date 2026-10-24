import 'dotenv/config';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME;

let client;
let database;

export async function connectDatabase() {
    if (database) {
        return database;
    }

    if (!uri || !dbName) {
        throw new Error('MongoDB environment variables are missing');
    }

    client = new MongoClient(uri);

    await client.connect();

    database = client.db(dbName);

    await database.command({ ping: 1 });

    console.log(`Connected to MongoDB database: ${dbName}`);

    return database;
}

export function getDatabase() {
    if (!database) {
        throw new Error('Database is not connected yet');
    }

    return database;
}

export async function closeDatabase() {
    if (client) {
        await client.close();
        client = undefined;
        database = undefined;
    }
}
