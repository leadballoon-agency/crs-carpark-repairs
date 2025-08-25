// Main API Router - Consolidates multiple endpoints to stay under Vercel's 12 function limit
const { neon } = require('@neondatabase/serverless');
const crypto = require('crypto');

const sql = neon(process.env.DATABASE_URL || '');

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
    }
];

module.exports = async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // Parse the path to determine the resource
    const path = req.url.replace('/api/main', '').replace(/\?.*$/, '');
    const segments = path.split('/').filter(Boolean);
    const resource = segments[0] || '';
    const subResource = segments[1] || '';
    
    try {
        // AUTH ENDPOINTS
        if (resource === 'auth') {
            if (subResource === 'login') {
                const { email, password } = req.body;
                
                // Try database first
                try {
                    if (process.env.DATABASE_URL) {
                        const result = await sql`
                            SELECT id, email, name, company, role 
                            FROM users 
                            WHERE email = ${email} AND password = ${hashPassword(password)}
                        `;
                        
                        if (result.length > 0) {
                            const user = result[0];
                            const token = generateToken();
                            
                            await sql`
                                INSERT INTO sessions (user_id, token, expires_at)
                                VALUES (${user.id}, ${token}, ${new Date(Date.now() + 24 * 60 * 60 * 1000)})
                            `;
                            
                            return res.status(200).json({ token, user });
                        }
                    }
                } catch (dbError) {
                    console.error('Database login error:', dbError);
                }
                
                // Fallback to mock users
                const user = fallbackUsers.find(u => 
                    u.email === email && u.password === hashPassword(password)
                );
                
                if (!user) {
                    return res.status(401).json({ error: 'Invalid credentials' });
                }
                
                const { password: _, ...userWithoutPassword } = user;
                return res.status(200).json({
                    token: generateToken(),
                    user: userWithoutPassword
                });
            }
            
            if (subResource === 'register') {
                const { email, password, name, company, phone } = req.body;
                
                if (!email || !password || !name || !company) {
                    return res.status(400).json({ error: 'All fields are required' });
                }
                
                try {
                    if (process.env.DATABASE_URL) {
                        const result = await sql`
                            INSERT INTO users (email, password, name, company, phone, role)
                            VALUES (${email}, ${hashPassword(password)}, ${name}, ${company}, ${phone}, 'client')
                            RETURNING id, email, name, company, role
                        `;
                        
                        const token = generateToken();
                        await sql`
                            INSERT INTO sessions (user_id, token, expires_at)
                            VALUES (${result[0].id}, ${token}, ${new Date(Date.now() + 24 * 60 * 60 * 1000)})
                        `;
                        
                        return res.status(201).json({
                            token,
                            user: result[0]
                        });
                    }
                } catch (dbError) {
                    if (dbError.message?.includes('duplicate key')) {
                        return res.status(400).json({ error: 'Email already registered' });
                    }
                    console.error('Registration error:', dbError);
                }
                
                return res.status(201).json({
                    message: 'Account created (demo mode)',
                    user: { email, name, company }
                });
            }
        }
        
        // SITES ENDPOINTS
        if (resource === 'sites') {
            if (req.method === 'GET') {
                // Mock sites data
                const sites = [
                    {
                        id: 1,
                        name: "McDonald's Birmingham",
                        address: '123 High Street, Birmingham',
                        zones: 3,
                        lastService: '2024-03-15',
                        status: 'active'
                    },
                    {
                        id: 2,
                        name: "McDonald's Manchester",
                        address: '456 Market St, Manchester',
                        zones: 5,
                        lastService: '2024-02-20',
                        status: 'active'
                    }
                ];
                
                return res.status(200).json(sites);
            }
            
            if (req.method === 'POST') {
                const site = req.body;
                return res.status(201).json({
                    ...site,
                    id: Date.now(),
                    status: 'active'
                });
            }
        }
        
        // DAMAGE REPORTS ENDPOINTS
        if (resource === 'damage-reports') {
            if (req.method === 'GET') {
                const reports = [
                    {
                        id: 1,
                        siteId: 1,
                        date: '2024-03-20',
                        zones: 2,
                        severity: 'medium',
                        status: 'pending',
                        estimatedCost: 4000
                    }
                ];
                
                return res.status(200).json(reports);
            }
            
            if (req.method === 'POST') {
                const report = req.body;
                return res.status(201).json({
                    ...report,
                    id: Date.now(),
                    status: 'pending'
                });
            }
        }
        
        // FEEDBACK ENDPOINTS
        if (resource === 'feedback') {
            if (req.method === 'POST') {
                const feedback = req.body;
                
                try {
                    if (process.env.DATABASE_URL) {
                        await sql`
                            INSERT INTO feedback (user_id, type, text, page, priority, status)
                            VALUES (${feedback.userId || 0}, ${feedback.type}, ${feedback.text}, 
                                    ${feedback.page}, ${feedback.priority || 'medium'}, 'new')
                        `;
                    }
                } catch (dbError) {
                    console.error('Feedback save error:', dbError);
                }
                
                return res.status(201).json({ 
                    message: 'Feedback received',
                    id: Date.now()
                });
            }
            
            if (req.method === 'GET' && subResource === 'all') {
                const mockFeedback = [
                    {
                        id: 1,
                        type: 'idea',
                        text: 'Add weather alerts for scheduled repairs',
                        user: 'John Richardson',
                        timestamp: '2024-03-20T10:00:00Z',
                        priority: 'high'
                    }
                ];
                
                return res.status(200).json(mockFeedback);
            }
        }
        
        // SETTINGS ENDPOINTS
        if (resource === 'settings') {
            const defaultSettings = {
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
            };
            
            if (req.method === 'GET') {
                return res.status(200).json(defaultSettings);
            }
            
            if (req.method === 'PUT') {
                return res.status(200).json({
                    message: 'Settings updated',
                    settings: req.body
                });
            }
        }
        
        // DOCS ENDPOINTS
        if (resource === 'docs') {
            const mockDocs = [
                {
                    id: 'getting-started',
                    title: 'Getting Started',
                    content: '# Getting Started\n\nWelcome to CRS Car Park Repairs...',
                    category: 'General',
                    version: '1.0.0',
                    lastUpdated: '2024-03-20T10:00:00Z'
                }
            ];
            
            if (req.method === 'GET') {
                if (subResource) {
                    const doc = mockDocs.find(d => d.id === subResource);
                    return res.status(doc ? 200 : 404).json(doc || { error: 'Document not found' });
                }
                return res.status(200).json(mockDocs);
            }
            
            if (req.method === 'POST' || req.method === 'PUT') {
                return res.status(200).json({
                    message: 'Document saved',
                    doc: req.body
                });
            }
        }
        
        // ADMIN STATS
        if (resource === 'admin' && subResource === 'stats') {
            const stats = {
                totalClients: 47,
                activeSites: 156,
                pendingReports: 12,
                monthlyRevenue: 45600,
                completedJobs: 234,
                avgResponseTime: '2.3 days'
            };
            
            return res.status(200).json(stats);
        }
        
        // ADMIN CLIENTS
        if (resource === 'admin' && subResource === 'clients') {
            if (req.method === 'GET') {
                const clients = [
                    {
                        id: 1,
                        name: 'John Richardson',
                        email: 'john@mcdonalds.com',
                        company: "McDonald's Franchise Group",
                        sites: 4,
                        plan: 'Gold',
                        status: 'active'
                    }
                ];
                
                return res.status(200).json(clients);
            }
            
            if (req.method === 'POST') {
                return res.status(201).json({
                    ...req.body,
                    id: Date.now(),
                    status: 'active'
                });
            }
        }
        
        // HEALTH CHECK
        if (resource === 'health') {
            return res.status(200).json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                database: !!process.env.DATABASE_URL
            });
        }
        
        // Not found
        return res.status(404).json({ error: `Endpoint /api/main/${resource}${subResource ? '/' + subResource : ''} not found` });
        
    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
}