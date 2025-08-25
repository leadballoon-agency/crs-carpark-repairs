// Database initialization endpoint - run this once to set up all tables
const { neon } = require('@neondatabase/serverless');
const crypto = require('crypto');

module.exports = async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Use POST to initialize database' });
    }
    
    const { confirmInit } = req.body;
    
    if (confirmInit !== 'INITIALIZE_DATABASE') {
        return res.status(400).json({ 
            error: 'Safety check failed', 
            message: 'Send { "confirmInit": "INITIALIZE_DATABASE" } to proceed' 
        });
    }
    
    try {
        if (!process.env.DATABASE_URL) {
            return res.status(500).json({
                error: 'Database not configured',
                message: 'DATABASE_URL environment variable is not set'
            });
        }
        
        const sql = neon(process.env.DATABASE_URL);
        
        // Create users table
        await sql`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                name VARCHAR(255) NOT NULL,
                company VARCHAR(255),
                phone VARCHAR(50),
                role VARCHAR(50) DEFAULT 'client' CHECK (role IN ('client', 'admin', 'super_admin')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        
        // Create sites table
        await sql`
            CREATE TABLE IF NOT EXISTS sites (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                address TEXT,
                contact_name VARCHAR(255),
                contact_phone VARCHAR(50),
                zones INTEGER DEFAULT 1,
                last_service DATE,
                next_service DATE,
                priority_plan VARCHAR(50),
                status VARCHAR(50) DEFAULT 'active',
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        
        // Create damage_reports table
        await sql`
            CREATE TABLE IF NOT EXISTS damage_reports (
                id SERIAL PRIMARY KEY,
                site_id INTEGER REFERENCES sites(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                report_date DATE DEFAULT CURRENT_DATE,
                zones_affected INTEGER DEFAULT 1,
                severity VARCHAR(50) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
                damage_data JSONB,
                photos TEXT[],
                estimated_cost DECIMAL(10, 2),
                actual_cost DECIMAL(10, 2),
                status VARCHAR(50) DEFAULT 'pending',
                repair_date DATE,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        
        // Create sessions table
        await sql`
            CREATE TABLE IF NOT EXISTS sessions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                token VARCHAR(255) UNIQUE NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        
        // Create feedback table
        await sql`
            CREATE TABLE IF NOT EXISTS feedback (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                type VARCHAR(50),
                text TEXT NOT NULL,
                page VARCHAR(255),
                priority VARCHAR(50) DEFAULT 'medium',
                status VARCHAR(50) DEFAULT 'new',
                resolved_at TIMESTAMP,
                resolved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        
        // Create settings table
        await sql`
            CREATE TABLE IF NOT EXISTS settings (
                id SERIAL PRIMARY KEY,
                key VARCHAR(255) UNIQUE NOT NULL,
                value JSONB NOT NULL,
                updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        
        // Create documentation table
        await sql`
            CREATE TABLE IF NOT EXISTS documentation (
                id SERIAL PRIMARY KEY,
                slug VARCHAR(255) UNIQUE NOT NULL,
                title VARCHAR(255) NOT NULL,
                content TEXT,
                category VARCHAR(100),
                version VARCHAR(50) DEFAULT '1.0.0',
                is_published BOOLEAN DEFAULT true,
                author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        
        // Create audit_log table for tracking changes
        await sql`
            CREATE TABLE IF NOT EXISTS audit_log (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                action VARCHAR(255) NOT NULL,
                entity_type VARCHAR(100),
                entity_id INTEGER,
                changes JSONB,
                ip_address VARCHAR(45),
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        
        // Create indexes for better performance
        await sql`CREATE INDEX IF NOT EXISTS idx_sites_user_id ON sites(user_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_damage_reports_site_id ON damage_reports(site_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status)`;
        
        // Insert super admin user (Mark)
        const hashPassword = (pwd) => crypto.createHash('sha256').update(pwd).digest('hex');
        
        await sql`
            INSERT INTO users (email, password, name, company, role)
            VALUES (
                'mark@leadballoon.co.uk',
                ${hashPassword('admin123!!')},
                'Mark Taylor',
                'Lead Balloon',
                'super_admin'
            )
            ON CONFLICT (email) 
            DO UPDATE SET 
                password = EXCLUDED.password,
                role = EXCLUDED.role
        `;
        
        // Insert default admin user
        await sql`
            INSERT INTO users (email, password, name, company, role)
            VALUES (
                'admin@crs.com',
                ${hashPassword('admin123')},
                'CRS Admin',
                'CRS Car Park Repairs',
                'admin'
            )
            ON CONFLICT (email) 
            DO UPDATE SET 
                password = EXCLUDED.password,
                role = EXCLUDED.role
        `;
        
        // Insert demo client user
        await sql`
            INSERT INTO users (email, password, name, company, role)
            VALUES (
                'demo@mcdonalds.com',
                ${hashPassword('demo123')},
                'John Richardson',
                'McDonalds Franchise Group',
                'client'
            )
            ON CONFLICT (email) DO NOTHING
        `;
        
        // Insert default settings
        await sql`
            INSERT INTO settings (key, value)
            VALUES (
                'site_config',
                ${JSON.stringify({
                    headline: {
                        main: "Fix Your",
                        highlight: "Entire Car Park",
                        sub: "One Zone. One Price. Complete Peace of Mind."
                    },
                    pricing: {
                        small: {
                            size: "Up to 10 spaces",
                            price: 2000,
                            description: "Perfect for small retail locations"
                        },
                        medium: {
                            size: "11-30 spaces",
                            price: 4000,
                            description: "Ideal for restaurants and offices"
                        },
                        large: {
                            size: "31+ spaces",
                            price: 6000,
                            description: "Complete solution for large sites"
                        }
                    },
                    priorityPlans: {
                        silver: {
                            price: 199,
                            features: ["Quarterly inspections", "Priority scheduling", "10% repair discount"]
                        },
                        gold: {
                            price: 399,
                            features: ["Bi-monthly inspections", "24h emergency response", "15% repair discount", "Dedicated account manager"]
                        },
                        platinum: {
                            price: 799,
                            features: ["Monthly inspections", "Same-day emergency response", "20% repair discount", "Dedicated account manager", "Annual surface treatment"]
                        }
                    }
                })}::jsonb
            )
            ON CONFLICT (key) DO NOTHING
        `;
        
        // Get counts for verification
        const userCount = await sql`SELECT COUNT(*) as count FROM users`;
        const tableList = await sql`
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public'
            ORDER BY tablename
        `;
        
        return res.status(200).json({
            success: true,
            message: 'Database initialized successfully',
            tables: tableList.map(t => t.tablename),
            users: userCount[0].count,
            admins: {
                superAdmin: 'mark@leadballoon.co.uk',
                admin: 'admin@crs.com',
                demoClient: 'demo@mcdonalds.com'
            }
        });
        
    } catch (error) {
        console.error('Database initialization error:', error);
        return res.status(500).json({
            error: 'Failed to initialize database',
            message: error.message,
            details: error.detail || error.hint,
            code: error.code,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}