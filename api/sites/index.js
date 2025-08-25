import { Pool } from '@neondatabase/serverless';

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // Get auth token
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL
    });
    
    try {
        // Verify session
        const sessionResult = await pool.query(
            'SELECT user_id FROM sessions WHERE token = $1 AND expires_at > NOW()',
            [token]
        );
        
        if (sessionResult.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid session' });
        }
        
        const userId = sessionResult.rows[0].user_id;
        
        if (req.method === 'GET') {
            // Get all sites for user
            const sitesResult = await pool.query(
                'SELECT * FROM sites WHERE user_id = $1 ORDER BY created_at DESC',
                [userId]
            );
            
            return res.status(200).json({ sites: sitesResult.rows });
        }
        
        if (req.method === 'POST') {
            // Create new site
            const { name, address } = req.body;
            
            const result = await pool.query(
                'INSERT INTO sites (user_id, name, address) VALUES ($1, $2, $3) RETURNING *',
                [userId, name, address]
            );
            
            return res.status(201).json({ site: result.rows[0] });
        }
        
        if (req.method === 'PUT') {
            // Update site
            const { id, name, address, status, issues } = req.body;
            
            const result = await pool.query(
                'UPDATE sites SET name = $2, address = $3, status = $4, issues = $5 WHERE id = $1 AND user_id = $6 RETURNING *',
                [id, name, address, status, issues, userId]
            );
            
            return res.status(200).json({ site: result.rows[0] });
        }
        
        if (req.method === 'DELETE') {
            // Delete site
            const { id } = req.query;
            
            await pool.query(
                'DELETE FROM sites WHERE id = $1 AND user_id = $2',
                [id, userId]
            );
            
            return res.status(200).json({ success: true });
        }
        
    } catch (error) {
        console.error('Database error:', error);
        return res.status(500).json({ error: 'Database error' });
    } finally {
        await pool.end();
    }
}