const { neon } = require('@neondatabase/serverless');
const crypto = require('crypto');

// Clean up the DATABASE_URL in case it has extra formatting
function cleanDbUrl(url) {
    if (!url) return '';
    
    // Remove 'psql ' prefix if present
    if (url.startsWith('psql ')) {
        url = url.substring(5);
    }
    
    // Remove surrounding quotes if present
    if ((url.startsWith("'") && url.endsWith("'")) || 
        (url.startsWith('"') && url.endsWith('"'))) {
        url = url.substring(1, url.length - 1);
    }
    
    // Remove channel_binding parameter if present (can cause issues)
    url = url.replace('&channel_binding=require', '');
    
    return url;
}

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

// Fallback users for when database is not available
const fallbackUsers = [
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
        name: 'Admin User',
        company: 'CRS Car Park Repairs',
        role: 'admin'
    },
    {
        id: 2,
        email: 'demo@mcdonalds.com',
        password: hashPassword('demo123'),
        name: 'John Richardson',
        company: 'McDonalds Franchise Group',
        role: 'client'
    },
    {
        id: 3,
        email: 'paul@carparkrepair.co.uk',
        password: hashPassword('CRS2024!'),
        name: 'Paul Richardson',
        company: 'CRS Car Park Repairs',
        role: 'admin'
    },
    {
        id: 4,
        email: 'kelsey@carparkrepair.co.uk',
        password: hashPassword('Kelsey2024!'),
        name: 'Kelsey Richardson',
        company: 'CRS Car Park Repairs',
        role: 'admin'
    }
];

module.exports = async function handler(req, res) {
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
    
    // Get the raw body and parse it
    let body = req.body;
    
    // If body is undefined, try to read it from the request
    if (!body && req.readable) {
        const chunks = [];
        for await (const chunk of req) {
            chunks.push(chunk);
        }
        const rawBody = Buffer.concat(chunks).toString();
        try {
            body = JSON.parse(rawBody);
        } catch (e) {
            return res.status(400).json({ error: 'Invalid JSON in request body' });
        }
    } else if (typeof body === 'string') {
        try {
            body = JSON.parse(body);
        } catch (e) {
            return res.status(400).json({ error: 'Invalid JSON in request body' });
        }
    }
    
    const { email, password } = body || {};
    
    if (!email || !password) {
        return res.status(400).json({ 
            error: 'Email and password are required',
            received: { hasBody: !!body, bodyType: typeof body, keys: body ? Object.keys(body) : [] }
        });
    }
    
    try {
        // Try database first if configured
        if (process.env.DATABASE_URL) {
            const dbUrl = cleanDbUrl(process.env.DATABASE_URL);
            const sql = neon(dbUrl);
            
            try {
                const result = await sql`
                    SELECT id, email, name, company, role 
                    FROM users 
                    WHERE email = ${email} AND password = ${hashPassword(password)}
                `;
                
                if (result.length > 0) {
                    const user = result[0];
                    const token = generateToken();
                    
                    // Store session
                    await sql`
                        INSERT INTO sessions (user_id, token, expires_at)
                        VALUES (${user.id}, ${token}, ${new Date(Date.now() + 24 * 60 * 60 * 1000)})
                        ON CONFLICT (token) DO NOTHING
                    `;
                    
                    return res.status(200).json({ 
                        success: true,
                        token, 
                        user,
                        source: 'database'
                    });
                }
            } catch (dbError) {
                console.error('Database error:', dbError);
                // Fall through to use fallback users
            }
        }
        
        // Use fallback users
        const user = fallbackUsers.find(u => 
            u.email === email && u.password === hashPassword(password)
        );
        
        if (!user) {
            return res.status(401).json({ 
                error: 'Invalid credentials',
                tried: { email, passwordLength: password.length }
            });
        }
        
        const { password: _, ...userWithoutPassword } = user;
        
        return res.status(200).json({
            success: true,
            token: generateToken(),
            user: userWithoutPassword,
            source: 'fallback'
        });
        
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ 
            error: 'Login failed',
            message: error.message
        });
    }
}