import { Pool } from '@neondatabase/serverless';
import crypto from 'crypto';

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL
    });
    
    try {
        // Verify admin session
        const sessionResult = await pool.query(
            `SELECT s.user_id FROM sessions s 
             JOIN users u ON s.user_id = u.id 
             WHERE s.token = $1 AND s.expires_at > NOW() AND u.role = 'admin'`,
            [token]
        );
        
        if (sessionResult.rows.length === 0) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        if (req.method === 'GET') {
            // Get all clients with site counts
            const result = await pool.query(`
                SELECT u.*, COUNT(s.id) as site_count
                FROM users u
                LEFT JOIN sites s ON u.id = s.user_id
                WHERE u.role = 'client'
                GROUP BY u.id
                ORDER BY u.created_at DESC
            `);
            
            return res.status(200).json({ clients: result.rows });
        }
        
        if (req.method === 'POST') {
            // Create new client
            const { email, password, name, company, phone, accountType } = req.body;
            
            const hashedPassword = hashPassword(password || crypto.randomBytes(8).toString('hex'));
            
            const result = await pool.query(
                `INSERT INTO users (email, password, name, company, phone, role)
                 VALUES ($1, $2, $3, $4, $5, 'client') RETURNING *`,
                [email, hashedPassword, name, company, phone]
            );
            
            return res.status(201).json({ client: result.rows[0] });
        }
        
        if (req.method === 'PUT') {
            // Update client
            const { id, name, company, phone } = req.body;
            
            const result = await pool.query(
                'UPDATE users SET name = $2, company = $3, phone = $4 WHERE id = $1 RETURNING *',
                [id, name, company, phone]
            );
            
            return res.status(200).json({ client: result.rows[0] });
        }
        
        if (req.method === 'DELETE') {
            // Delete client
            const { id } = req.query;
            
            await pool.query('DELETE FROM users WHERE id = $1 AND role = "client"', [id]);
            
            return res.status(200).json({ success: true });
        }
        
    } catch (error) {
        console.error('Database error:', error);
        return res.status(500).json({ error: 'Database error' });
    } finally {
        await pool.end();
    }
}