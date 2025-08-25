import { Pool } from '@neondatabase/serverless';

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
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
        // Verify session and get user
        const sessionResult = await pool.query(
            'SELECT s.user_id, u.role FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = $1 AND s.expires_at > NOW()',
            [token]
        );
        
        if (sessionResult.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid session' });
        }
        
        const { user_id: userId, role } = sessionResult.rows[0];
        
        if (req.method === 'GET') {
            let query, params;
            
            if (role === 'admin') {
                // Admin sees all reports
                query = `
                    SELECT dr.*, u.name as user_name, u.company, s.name as site_name
                    FROM damage_reports dr
                    LEFT JOIN users u ON dr.user_id = u.id
                    LEFT JOIN sites s ON dr.site_id = s.id
                    ORDER BY dr.created_at DESC
                `;
                params = [];
            } else {
                // Clients see only their reports
                query = `
                    SELECT dr.*, s.name as site_name
                    FROM damage_reports dr
                    LEFT JOIN sites s ON dr.site_id = s.id
                    WHERE dr.user_id = $1
                    ORDER BY dr.created_at DESC
                `;
                params = [userId];
            }
            
            const result = await pool.query(query, params);
            return res.status(200).json({ reports: result.rows });
        }
        
        if (req.method === 'POST') {
            const { site_id, description, severity, photos, zones } = req.body;
            
            const estimated_cost = zones * 2000; // £2000 per zone
            
            const result = await pool.query(
                `INSERT INTO damage_reports (user_id, site_id, description, severity, photos, zones, estimated_cost)
                 VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
                [userId, site_id, description, severity, photos || [], zones || 1, estimated_cost]
            );
            
            return res.status(201).json({ report: result.rows[0] });
        }
        
        if (req.method === 'PUT') {
            // Update report status (admin only)
            if (role !== 'admin') {
                return res.status(403).json({ error: 'Admin access required' });
            }
            
            const { id, status } = req.body;
            
            const result = await pool.query(
                'UPDATE damage_reports SET status = $2 WHERE id = $1 RETURNING *',
                [id, status]
            );
            
            return res.status(200).json({ report: result.rows[0] });
        }
        
    } catch (error) {
        console.error('Database error:', error);
        return res.status(500).json({ error: 'Database error' });
    } finally {
        await pool.end();
    }
}