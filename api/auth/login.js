// Vercel Serverless Function for login
const crypto = require('crypto');

// Hardcoded users for demo (in production, use a database)
const users = [
    {
        id: "1",
        email: "admin@crs.com",
        password: hashPassword("admin123"),
        name: "Admin User",
        company: "CRS Car Park Repairs",
        phone: "024 7699 2244",
        role: "admin"
    },
    {
        id: "2",
        email: "mcdonalds@franchise.com",
        password: hashPassword("demo123"),
        name: "John Richardson",
        company: "McDonald's Franchise Group",
        phone: "07700 900123",
        role: "client",
        sites: 23
    }
];

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

export default function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }
    
    const user = users.find(u => u.email === email && u.password === hashPassword(password));
    
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate simple token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    
    res.status(200).json({ 
        token, 
        user: userWithoutPassword 
    });
}