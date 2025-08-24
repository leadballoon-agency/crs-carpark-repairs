const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Simple file-based database
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
                    issues: 7,
                    coordinates: { lat: 52.4862, lng: -1.8904 }
                },
                {
                    id: '2',
                    userId: '2',
                    location: 'Coventry Ring Road',
                    address: 'Ring Road, CV1 3XX',
                    status: 'scheduled',
                    lastInspection: '2024-02-20',
                    nextService: '2024-03-15',
                    issues: 3,
                    coordinates: { lat: 52.4068, lng: -1.5197 }
                },
                {
                    id: '3',
                    userId: '2',
                    location: 'Solihull Retail Park',
                    address: 'Retail Park, B91 4XX',
                    status: 'healthy',
                    lastInspection: '2024-02-28',
                    nextService: '2024-04-28',
                    issues: 0,
                    coordinates: { lat: 52.4120, lng: -1.7761 }
                },
                {
                    id: '4',
                    userId: '2',
                    location: 'Wolverhampton Drive-Thru',
                    address: 'Queen Street, WV1 5XX',
                    status: 'scheduled',
                    lastInspection: '2024-02-10',
                    nextService: '2024-03-20',
                    issues: 2,
                    coordinates: { lat: 52.5862, lng: -2.1288 }
                }
            ],
            reports: [],
            invoices: [],
            sessions: []
        };
        fs.writeFileSync(DB_PATH, JSON.stringify(initialDB, null, 2));
    }
}

// Database helper functions
function getDB() {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function saveDB(data) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// Simple password hashing (in production, use bcrypt)
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// Generate token (simple implementation)
function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

// Middleware to verify token
function authenticateToken(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Access denied' });
    }
    
    const db = getDB();
    const session = db.sessions.find(s => s.token === token && new Date(s.expiresAt) > new Date());
    
    if (!session) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
    
    req.user = db.users.find(u => u.id === session.userId);
    next();
}

// Initialize database
initDB();

// ============= API ROUTES =============

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Register new user
app.post('/api/auth/register', (req, res) => {
    const { email, password, name, company, phone } = req.body;
    
    // Validation
    if (!email || !password || !name || !company || !phone) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    
    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    const db = getDB();
    
    // Check if user exists
    if (db.users.find(u => u.email === email)) {
        return res.status(400).json({ error: 'Email already registered' });
    }
    
    // Create new user
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
    
    res.status(201).json({ 
        message: 'Account created successfully',
        user: { id: newUser.id, email: newUser.email, name: newUser.name }
    });
});

// Login
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    
    const db = getDB();
    const user = db.users.find(u => u.email === email && u.password === hashPassword(password));
    
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Create session
    const token = generateToken();
    const session = {
        id: String(Date.now()),
        userId: user.id,
        token,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    };
    
    db.sessions.push(session);
    saveDB(db);
    
    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
        token,
        user: userWithoutPassword
    });
});

// Logout
app.post('/api/auth/logout', authenticateToken, (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1];
    
    const db = getDB();
    db.sessions = db.sessions.filter(s => s.token !== token);
    saveDB(db);
    
    res.json({ message: 'Logged out successfully' });
});

// Get current user
app.get('/api/auth/me', authenticateToken, (req, res) => {
    const { password: _, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
});

// Get user's sites
app.get('/api/sites', authenticateToken, (req, res) => {
    const db = getDB();
    const userSites = db.sites.filter(s => s.userId === req.user.id);
    
    res.json(userSites);
});

// Get site by ID
app.get('/api/sites/:id', authenticateToken, (req, res) => {
    const db = getDB();
    const site = db.sites.find(s => s.id === req.params.id && s.userId === req.user.id);
    
    if (!site) {
        return res.status(404).json({ error: 'Site not found' });
    }
    
    res.json(site);
});

// Create new site
app.post('/api/sites', authenticateToken, (req, res) => {
    const { location, address, coordinates } = req.body;
    
    if (!location || !address) {
        return res.status(400).json({ error: 'Location and address are required' });
    }
    
    const db = getDB();
    
    const newSite = {
        id: String(Date.now()),
        userId: req.user.id,
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
    
    // Update user's site count
    const userIndex = db.users.findIndex(u => u.id === req.user.id);
    if (userIndex !== -1) {
        db.users[userIndex].sites = (db.users[userIndex].sites || 0) + 1;
    }
    
    saveDB(db);
    
    res.status(201).json(newSite);
});

// Submit damage report
app.post('/api/reports', authenticateToken, (req, res) => {
    const { siteId, severity, description, photoUrl } = req.body;
    
    if (!siteId || !severity || !description) {
        return res.status(400).json({ error: 'Site, severity, and description are required' });
    }
    
    const db = getDB();
    
    // Verify site belongs to user
    const site = db.sites.find(s => s.id === siteId && s.userId === req.user.id);
    if (!site) {
        return res.status(404).json({ error: 'Site not found' });
    }
    
    const newReport = {
        id: String(Date.now()),
        userId: req.user.id,
        siteId,
        siteName: site.location,
        severity,
        description,
        photoUrl: photoUrl || null,
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    
    db.reports.push(newReport);
    
    // Update site status based on severity
    if (severity === 'critical') {
        site.status = 'critical';
        site.issues = (site.issues || 0) + 1;
    }
    
    saveDB(db);
    
    res.status(201).json({
        message: 'Report submitted successfully',
        report: newReport
    });
});

// Get user's reports
app.get('/api/reports', authenticateToken, (req, res) => {
    const db = getDB();
    const userReports = db.reports.filter(r => r.userId === req.user.id);
    
    res.json(userReports);
});

// Get dashboard stats
app.get('/api/dashboard/stats', authenticateToken, (req, res) => {
    const db = getDB();
    const userSites = db.sites.filter(s => s.userId === req.user.id);
    const userReports = db.reports.filter(r => r.userId === req.user.id);
    
    const stats = {
        totalSites: userSites.length,
        urgentSites: userSites.filter(s => s.status === 'critical').length,
        scheduledRepairs: userSites.filter(s => s.status === 'scheduled').length,
        healthySites: userSites.filter(s => s.status === 'healthy').length,
        totalReports: userReports.length,
        pendingReports: userReports.filter(r => r.status === 'pending').length,
        savedThisYear: 47320, // Mock data
        costReduction: 62 // Mock percentage
    };
    
    res.json(stats);
});

// Update site status
app.patch('/api/sites/:id/status', authenticateToken, (req, res) => {
    const { status } = req.body;
    
    if (!['healthy', 'scheduled', 'critical'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }
    
    const db = getDB();
    const siteIndex = db.sites.findIndex(s => s.id === req.params.id && s.userId === req.user.id);
    
    if (siteIndex === -1) {
        return res.status(404).json({ error: 'Site not found' });
    }
    
    db.sites[siteIndex].status = status;
    saveDB(db);
    
    res.json({ message: 'Status updated', site: db.sites[siteIndex] });
});

// Search sites
app.get('/api/sites/search', authenticateToken, (req, res) => {
    const { q } = req.query;
    const db = getDB();
    
    let userSites = db.sites.filter(s => s.userId === req.user.id);
    
    if (q) {
        const searchTerm = q.toLowerCase();
        userSites = userSites.filter(s => 
            s.location.toLowerCase().includes(searchTerm) ||
            s.address.toLowerCase().includes(searchTerm)
        );
    }
    
    res.json(userSites);
});

// Start server
app.listen(PORT, () => {
    console.log(`
    🚀 CRS Backend Server Running
    ================================
    📍 API: http://localhost:${PORT}/api
    📍 Frontend: http://localhost:${PORT}
    
    API Endpoints:
    - POST   /api/auth/register
    - POST   /api/auth/login
    - POST   /api/auth/logout
    - GET    /api/auth/me
    - GET    /api/sites
    - POST   /api/sites
    - GET    /api/sites/:id
    - PATCH  /api/sites/:id/status
    - GET    /api/sites/search?q=term
    - POST   /api/reports
    - GET    /api/reports
    - GET    /api/dashboard/stats
    
    Test accounts:
    - admin@crs.com / admin123
    - mcdonalds@franchise.com / demo123
    `);
});