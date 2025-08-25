import { Pool } from '@neondatabase/serverless';

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
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
            `SELECT s.user_id, u.role FROM sessions s 
             JOIN users u ON s.user_id = u.id 
             WHERE s.token = $1 AND s.expires_at > NOW() AND u.role = 'admin'`,
            [token]
        );
        
        if (sessionResult.rows.length === 0) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        // Get statistics
        const stats = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM users WHERE role = 'client') as total_clients,
                (SELECT COUNT(*) FROM sites) as total_sites,
                (SELECT COUNT(*) FROM damage_reports WHERE status = 'pending') as pending_reports,
                (SELECT COUNT(*) FROM damage_reports WHERE created_at > NOW() - INTERVAL '7 days') as weekly_reports,
                (SELECT SUM(estimated_cost) FROM damage_reports WHERE status = 'approved') as total_revenue,
                (SELECT COUNT(*) FROM damage_reports WHERE severity = 'urgent') as urgent_repairs,
                (SELECT COUNT(*) FROM onboarding_leads WHERE status = 'new') as new_leads,
                (SELECT COUNT(*) FROM sessions WHERE expires_at > NOW()) as active_sessions
        `);
        
        // Get recent activity
        const recentActivity = await pool.query(`
            SELECT 'report' as type, description as title, created_at, severity as meta
            FROM damage_reports
            ORDER BY created_at DESC
            LIMIT 5
        `);
        
        // Get top clients by sites
        const topClients = await pool.query(`
            SELECT u.company, COUNT(s.id) as site_count
            FROM users u
            LEFT JOIN sites s ON u.id = s.user_id
            WHERE u.role = 'client'
            GROUP BY u.id, u.company
            ORDER BY site_count DESC
            LIMIT 5
        `);
        
        return res.status(200).json({
            stats: stats.rows[0],
            recentActivity: recentActivity.rows,
            topClients: topClients.rows
        });
        
    } catch (error) {
        console.error('Database error:', error);
        return res.status(500).json({ error: 'Database error' });
    } finally {
        await pool.end();
    }
}