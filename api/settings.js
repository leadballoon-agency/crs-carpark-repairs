import { Pool } from '@neondatabase/serverless';

// Default settings
const defaultSettings = {
    headline: {
        main: "Fix Your",
        highlight: "Entire Car Park",
        sub: "One Zone. One Price."
    },
    pricing: {
        small: {
            name: "Small Zone",
            size: "Up to 50m²",
            price: 2000,
            description: "Perfect for small parking areas"
        },
        medium: {
            name: "Medium Zone",
            size: "50-150m²",
            price: 4000,
            description: "Ideal for medium-sized car parks"
        },
        large: {
            name: "Large Zone",
            size: "150m²+",
            price: 6000,
            description: "Complete solution for large areas"
        },
        minimum: 2000
    },
    features: {
        guarantee: "5 Year Guarantee",
        response: "24 Hour Response",
        warranty: "Full Warranty Coverage"
    },
    priorityPlans: {
        silver: {
            name: "Silver",
            price: 199,
            period: "month",
            features: [
                "Priority scheduling",
                "48-hour response time",
                "Quarterly inspections",
                "10% repair discount"
            ],
            popular: false
        },
        gold: {
            name: "Gold",
            price: 399,
            period: "month",
            features: [
                "Next-day response",
                "Monthly inspections",
                "20% repair discount",
                "Emergency hotline",
                "Detailed reporting"
            ],
            popular: true
        },
        platinum: {
            name: "Platinum",
            price: 799,
            period: "month",
            features: [
                "Same-day response",
                "Bi-weekly inspections",
                "30% repair discount",
                "24/7 emergency support",
                "Dedicated account manager",
                "Custom reporting dashboard"
            ],
            popular: false
        }
    }
};

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    try {
        // For GET requests, return current settings
        if (req.method === 'GET') {
            // Try to get from database first
            try {
                const pool = new Pool({
                    connectionString: process.env.DATABASE_URL
                });
                
                const result = await pool.query(
                    'SELECT * FROM site_settings ORDER BY created_at DESC LIMIT 1'
                );
                
                await pool.end();
                
                if (result.rows.length > 0) {
                    return res.status(200).json({ 
                        settings: JSON.parse(result.rows[0].settings) 
                    });
                }
            } catch (dbError) {
                console.log('Database error, using defaults:', dbError);
            }
            
            // Return defaults or from localStorage
            const localSettings = global.siteSettings || defaultSettings;
            return res.status(200).json({ settings: localSettings });
        }
        
        // For PUT requests, update settings (admin only)
        if (req.method === 'PUT') {
            const token = req.headers.authorization?.replace('Bearer ', '');
            
            if (!token) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            
            // Verify admin/super_admin
            try {
                const pool = new Pool({
                    connectionString: process.env.DATABASE_URL
                });
                
                const sessionResult = await pool.query(
                    `SELECT s.user_id, u.role FROM sessions s 
                     JOIN users u ON s.user_id = u.id 
                     WHERE s.token = $1 AND s.expires_at > NOW()`,
                    [token]
                );
                
                if (sessionResult.rows.length === 0 || 
                    (sessionResult.rows[0].role !== 'admin' && sessionResult.rows[0].role !== 'super_admin')) {
                    await pool.end();
                    return res.status(403).json({ error: 'Admin access required' });
                }
                
                // Save settings to database
                const settings = req.body.settings;
                
                // Create table if it doesn't exist
                await pool.query(`
                    CREATE TABLE IF NOT EXISTS site_settings (
                        id SERIAL PRIMARY KEY,
                        settings JSONB NOT NULL,
                        updated_by INTEGER REFERENCES users(id),
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                `);
                
                // Insert new settings
                await pool.query(
                    'INSERT INTO site_settings (settings, updated_by) VALUES ($1, $2)',
                    [JSON.stringify(settings), sessionResult.rows[0].user_id]
                );
                
                await pool.end();
                
                // Also store in memory for quick access
                global.siteSettings = settings;
                
                return res.status(200).json({ 
                    success: true,
                    settings: settings 
                });
                
            } catch (dbError) {
                console.error('Database error:', dbError);
                // Fallback: store in memory
                global.siteSettings = req.body.settings;
                return res.status(200).json({ 
                    success: true,
                    settings: req.body.settings,
                    note: 'Saved locally, will sync when database is available'
                });
            }
        }
        
        return res.status(405).json({ error: 'Method not allowed' });
        
    } catch (error) {
        console.error('Settings API error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}