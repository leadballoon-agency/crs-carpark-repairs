import { Pool } from '@neondatabase/serverless';

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL
    });
    
    try {
        // Get user from token if provided
        let userId = null;
        let userRole = null;
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (token) {
            const sessionResult = await pool.query(
                `SELECT s.user_id, u.role FROM sessions s 
                 JOIN users u ON s.user_id = u.id 
                 WHERE s.token = $1 AND s.expires_at > NOW()`,
                [token]
            );
            
            if (sessionResult.rows.length > 0) {
                userId = sessionResult.rows[0].user_id;
                userRole = sessionResult.rows[0].role;
            }
        }
        
        if (req.method === 'GET') {
            // Get all feedback (admin only)
            if (userRole !== 'admin') {
                return res.status(403).json({ error: 'Admin access required' });
            }
            
            const feedback = await pool.query(`
                SELECT f.*, u.name as user_name, u.company
                FROM feedback f
                LEFT JOIN users u ON f.user_id = u.id
                ORDER BY f.created_at DESC
            `);
            
            return res.status(200).json({ feedback: feedback.rows });
        }
        
        if (req.method === 'POST') {
            // Submit feedback
            const { type, text, page, priority, votes } = req.body;
            
            const result = await pool.query(
                `INSERT INTO feedback (user_id, type, text, page, priority, votes)
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
                [userId, type || 'general', text, page || '/', priority || 'medium', votes || 0]
            );
            
            return res.status(201).json({ feedback: result.rows[0] });
        }
        
        if (req.method === 'PUT') {
            // Update feedback (vote or status)
            const { id, action, status } = req.body;
            
            if (action === 'vote') {
                // Increment vote count
                const result = await pool.query(
                    'UPDATE feedback SET votes = votes + 1 WHERE id = $1 RETURNING *',
                    [id]
                );
                return res.status(200).json({ feedback: result.rows[0] });
            }
            
            if (status && userRole === 'admin') {
                // Update status (resolved, in-progress, etc.)
                const result = await pool.query(
                    'UPDATE feedback SET status = $2 WHERE id = $1 RETURNING *',
                    [id, status]
                );
                return res.status(200).json({ feedback: result.rows[0] });
            }
            
            return res.status(400).json({ error: 'Invalid update request' });
        }
        
        if (req.method === 'DELETE') {
            // Delete feedback (admin only)
            if (userRole !== 'admin') {
                return res.status(403).json({ error: 'Admin access required' });
            }
            
            const { id } = req.query;
            await pool.query('DELETE FROM feedback WHERE id = $1', [id]);
            
            return res.status(200).json({ success: true });
        }
        
    } catch (error) {
        console.error('Database error:', error);
        return res.status(500).json({ error: 'Database error' });
    } finally {
        await pool.end();
    }
}