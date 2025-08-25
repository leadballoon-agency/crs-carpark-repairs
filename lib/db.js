// Neon Database Connection for Vercel
import { Pool } from '@neondatabase/serverless';

// Create connection pool
export function getDb() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_m3rzpWNXlFO6@ep-crimson-truth-abxdjj0h-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require'
    });
    return pool;
}

// Helper function to hash passwords
export function hashPassword(password) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(password).digest('hex');
}