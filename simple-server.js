const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const url = require('url');

const PORT = process.env.PORT || 3002;
const DB_PATH = path.join(__dirname, 'database.json');

// Initialize database
function initDB() {
    if (!fs.existsSync(DB_PATH)) {
        const initialDB = {
            users: [
                {
                    id: '1',
                    email: 'admin@crs.com',
                    password: hashPassword('admin123'),
                    name: 'Admin User',
                    company: 'CRS Car Park Repairs',
                    phone: '024 7699 2244',
                    role: 'admin',
                    createdAt: new Date().toISOString()
                },
                {
                    id: '2',
                    email: 'mcdonalds@franchise.com',
                    password: hashPassword('demo123'),
                    name: 'John Richardson',
                    company: "McDonald's Franchise Group",
                    phone: '07700 900123',
                    role: 'client',
                    sites: 23,
                    createdAt: new Date().toISOString()
                }
            ],
            sites: [
                {
                    id: '1',
                    userId: '2',
                    location: 'Birmingham City Centre',
                    address: 'High Street, B1 2XX',
                    status: 'critical',
                    lastInspection: '2024-02-15',
                    nextService: '2024-03-12',
                    issues: 7
                },
                {
                    id: '2',
                    userId: '2',
                    location: 'Coventry Ring Road',
                    address: 'Ring Road, CV1 3XX',
                    status: 'scheduled',
                    lastInspection: '2024-02-20',
                    nextService: '2024-03-15',
                    issues: 3
                },
                {
                    id: '3',
                    userId: '2',
                    location: 'Solihull Retail Park',
                    address: 'Retail Park, B91 4XX',
                    status: 'healthy',
                    lastInspection: '2024-02-28',
                    nextService: '2024-04-28',
                    issues: 0
                }
            ],
            reports: [],
            sessions: []
        };
        fs.writeFileSync(DB_PATH, JSON.stringify(initialDB, null, 2));
    }
}

// Database functions
function getDB() {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function saveDB(data) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

// Initialize database
initDB();

// MIME types
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

// Create server
const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    
    // API Routes
    if (pathname.startsWith('/api/')) {
        handleAPI(req, res, pathname, parsedUrl.query);
    } else {
        // Serve static files
        let filePath = '.' + pathname;
        if (filePath === './') {
            filePath = './index.html';
        }
        
        const extname = String(path.extname(filePath)).toLowerCase();
        const contentType = mimeTypes[extname] || 'application/octet-stream';
        
        fs.readFile(filePath, (error, content) => {
            if (error) {
                if (error.code === 'ENOENT') {
                    res.writeHead(404);
                    res.end('File not found');
                } else {
                    res.writeHead(500);
                    res.end('Server error: ' + error.code);
                }
            } else {
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(content, 'utf-8');
            }
        });
    }
});

// Handle API requests
function handleAPI(req, res, pathname, query) {
    let body = '';
    
    req.on('data', chunk => {
        body += chunk.toString();
    });
    
    req.on('end', () => {
        const jsonBody = body ? JSON.parse(body) : {};
        
        // Health check
        if (pathname === '/api/health' && req.method === 'GET') {
            sendJSON(res, 200, { status: 'OK', timestamp: new Date().toISOString() });
            return;
        }
        
        // Login
        if (pathname === '/api/auth/login' && req.method === 'POST') {
            const { email, password } = jsonBody;
            const db = getDB();
            const user = db.users.find(u => u.email === email && u.password === hashPassword(password));
            
            if (!user) {
                sendJSON(res, 401, { error: 'Invalid credentials' });
                return;
            }
            
            const token = generateToken();
            const session = {
                id: String(Date.now()),
                userId: user.id,
                token,
                createdAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            };
            
            db.sessions.push(session);
            saveDB(db);
            
            const { password: _, ...userWithoutPassword } = user;
            sendJSON(res, 200, { token, user: userWithoutPassword });
            return;
        }
        
        // Register
        if (pathname === '/api/auth/register' && req.method === 'POST') {
            const { email, password, name, company, phone } = jsonBody;
            
            if (!email || !password || !name || !company || !phone) {
                sendJSON(res, 400, { error: 'All fields are required' });
                return;
            }
            
            if (password.length < 6) {
                sendJSON(res, 400, { error: 'Password must be at least 6 characters' });
                return;
            }
            
            const db = getDB();
            
            if (db.users.find(u => u.email === email)) {
                sendJSON(res, 400, { error: 'Email already registered' });
                return;
            }
            
            const newUser = {
                id: String(Date.now()),
                email,
                password: hashPassword(password),
                name,
                company,
                phone,
                role: 'client',
                sites: 0,
                createdAt: new Date().toISOString()
            };
            
            db.users.push(newUser);
            saveDB(db);
            
            sendJSON(res, 201, { 
                message: 'Account created successfully',
                user: { id: newUser.id, email: newUser.email, name: newUser.name }
            });
            return;
        }
        
        // Protected routes - check authorization
        const authHeader = req.headers.authorization;
        const token = authHeader ? authHeader.split(' ')[1] : null;
        
        if (!token) {
            sendJSON(res, 401, { error: 'Access denied' });
            return;
        }
        
        const db = getDB();
        const session = db.sessions.find(s => s.token === token && new Date(s.expiresAt) > new Date());
        
        if (!session) {
            sendJSON(res, 403, { error: 'Invalid or expired token' });
            return;
        }
        
        const user = db.users.find(u => u.id === session.userId);
        
        // Get user info
        if (pathname === '/api/auth/me' && req.method === 'GET') {
            const { password: _, ...userWithoutPassword } = user;
            sendJSON(res, 200, userWithoutPassword);
            return;
        }
        
        // Get dashboard stats
        if (pathname === '/api/dashboard/stats' && req.method === 'GET') {
            const userSites = db.sites.filter(s => s.userId === user.id);
            const userReports = db.reports.filter(r => r.userId === user.id);
            
            const stats = {
                totalSites: userSites.length,
                urgentSites: userSites.filter(s => s.status === 'critical').length,
                scheduledRepairs: userSites.filter(s => s.status === 'scheduled').length,
                healthySites: userSites.filter(s => s.status === 'healthy').length,
                totalReports: userReports.length,
                pendingReports: userReports.filter(r => r.status === 'pending').length,
                savedThisYear: 47320,
                costReduction: 62
            };
            
            sendJSON(res, 200, stats);
            return;
        }
        
        // Get sites
        if (pathname === '/api/sites' && req.method === 'GET') {
            const userSites = db.sites.filter(s => s.userId === user.id);
            sendJSON(res, 200, userSites);
            return;
        }
        
        // Create site
        if (pathname === '/api/sites' && req.method === 'POST') {
            const { location, address, coordinates } = jsonBody;
            
            if (!location || !address) {
                sendJSON(res, 400, { error: 'Location and address are required' });
                return;
            }
            
            const newSite = {
                id: String(Date.now()),
                userId: user.id,
                location,
                address,
                status: 'healthy',
                lastInspection: new Date().toISOString().split('T')[0],
                nextService: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                issues: 0,
                coordinates: coordinates || null,
                createdAt: new Date().toISOString()
            };
            
            db.sites.push(newSite);
            
            const userIndex = db.users.findIndex(u => u.id === user.id);
            if (userIndex !== -1) {
                db.users[userIndex].sites = (db.users[userIndex].sites || 0) + 1;
            }
            
            saveDB(db);
            sendJSON(res, 201, newSite);
            return;
        }
        
        // Logout
        if (pathname === '/api/auth/logout' && req.method === 'POST') {
            db.sessions = db.sessions.filter(s => s.token !== token);
            saveDB(db);
            sendJSON(res, 200, { message: 'Logged out successfully' });
            return;
        }
        
        // Default 404
        sendJSON(res, 404, { error: 'Endpoint not found' });
    });
}

// Helper to send JSON response
function sendJSON(res, statusCode, data) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
}

// Start server
server.listen(PORT, () => {
    console.log(`
    🚀 CRS Backend Server Running (No Dependencies!)
    ================================================
    📍 Server: http://localhost:${PORT}
    📍 API Health: http://localhost:${PORT}/api/health
    📍 Portal: http://localhost:${PORT}/portal-api.html
    
    Test accounts:
    - admin@crs.com / admin123
    - mcdonalds@franchise.com / demo123
    
    Press Ctrl+C to stop the server
    `);
});