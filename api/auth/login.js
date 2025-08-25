import { Pool } from '@neondatabase/serverless';
import crypto from 'crypto';

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }
    
    try {
        // Connect to Neon
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_m3rzpWNXlFO6@ep-crimson-truth-abxdjj0h-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require'
        });
        
        // Query user
        const hashedPassword = hashPassword(password);
        const result = await pool.query(
            'SELECT id, email, name, company, phone, role FROM users WHERE email = $1 AND password = $2',
            [email, hashedPassword]
        );
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const user = result.rows[0];
        
        // Generate token and save session
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        
        await pool.query(
            'INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3)',
            [user.id, token, expiresAt]
        );
        
        await pool.end();
        
        return res.status(200).json({ 
            token, 
            user 
        });
        
    } catch (error) {
        console.error('Database error:', error);
        
        // Fallback to hardcoded users if DB fails
        const users = [
            {
                id: 0,
                email: 'mark@leadballoon.co.uk',
                password: hashPassword('admin123!!'),
                name: 'Mark Taylor',
                company: 'Lead Balloon',
                role: 'super_admin'
            },
            {
                id: 1,
                email: 'admin@crs.com',
                password: hashPassword('admin123'),
                name: 'Paul (CRS Admin)',
                company: 'CRS Car Park Repairs',
                role: 'admin'
            },
            {
                id: 2,
                email: 'mcdonalds@franchise.com',
                password: hashPassword('demo123'),
                name: 'John Richardson',
                company: 'McDonald\'s Franchise Group',
                role: 'client'
            }
        ];
        
        const user = users.find(u => u.email === email && u.password === hashPassword(password));
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const { password: _, ...userWithoutPassword } = user;
        const token = crypto.randomBytes(32).toString('hex');
        
        return res.status(200).json({ 
            token, 
            user: userWithoutPassword 
        });
    }
}