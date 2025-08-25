import { Pool } from '@neondatabase/serverless';

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL
    });
    
    try {
        if (req.method === 'GET') {
            // Get onboarding leads (admin only)
            const token = req.headers.authorization?.replace('Bearer ', '');
            
            if (!token) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            
            // Verify admin
            const sessionResult = await pool.query(
                `SELECT s.user_id FROM sessions s 
                 JOIN users u ON s.user_id = u.id 
                 WHERE s.token = $1 AND s.expires_at > NOW() AND u.role = 'admin'`,
                [token]
            );
            
            if (sessionResult.rows.length === 0) {
                return res.status(403).json({ error: 'Admin access required' });
            }
            
            const leads = await pool.query(
                'SELECT * FROM onboarding_leads ORDER BY created_at DESC'
            );
            
            return res.status(200).json({ leads: leads.rows });
        }
        
        if (req.method === 'POST') {
            // Submit onboarding
            const { email, company, sites_data } = req.body;
            
            const result = await pool.query(
                'INSERT INTO onboarding_leads (email, company, sites_data) VALUES ($1, $2, $3) RETURNING *',
                [email, company, JSON.stringify(sites_data)]
            );
            
            return res.status(201).json({ lead: result.rows[0] });
        }
        
    } catch (error) {
        console.error('Database error:', error);
        return res.status(500).json({ error: 'Database error' });
    } finally {
        await pool.end();
    }
}