// Vercel Serverless Function for Authentication
const crypto = require('crypto');

// Mock database (in production, use a real database)
const users = [
    {
        id: '1',
        email: 'admin@crs.com',
        password: hashPassword('admin123'),
        name: 'Admin User',
        company: 'CRS Car Park Repairs',
        role: 'admin'
    },
    {
        id: '2',
        email: 'mcdonalds@franchise.com',
        password: hashPassword('demo123'),
        name: 'John Richardson',
        company: "McDonald's Franchise Group",
        role: 'client'
    }
];

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

export default function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    const { email, password, action } = req.body;
    
    // Login action
    if (action === 'login') {
        const user = users.find(u => u.email === email && u.password === hashPassword(password));
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const token = generateToken();
        const { password: _, ...userWithoutPassword } = user;
        
        return res.status(200).json({
            token,
            user: userWithoutPassword
        });
    }
    
    // Register action (simplified for demo)
    if (action === 'register') {
        const { name, company, phone } = req.body;
        
        if (!email || !password || !name || !company) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        if (users.find(u => u.email === email)) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        
        const newUser = {
            id: String(Date.now()),
            email,
            password: hashPassword(password),
            name,
            company,
            phone,
            role: 'client'
        };
        
        users.push(newUser);
        
        return res.status(201).json({
            message: 'Account created successfully',
            user: { id: newUser.id, email: newUser.email, name: newUser.name }
        });
    }
    
    return res.status(400).json({ error: 'Invalid action' });
};