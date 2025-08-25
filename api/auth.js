const crypto = require('crypto');

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

// Hardcoded users for reliability
const users = [
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
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // Only accept POST
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false,
            error: 'Method not allowed' 
        });
    }
    
    try {
        // Get credentials from body
        const { email, password } = req.body || {};
        
        // Validate input
        if (!email || !password) {
            return res.status(400).json({ 
                success: false,
                error: 'Email and password are required'
            });
        }
        
        // Hash the provided password
        const hashedPassword = hashPassword(password);
        
        // Find user
        const user = users.find(u => 
            u.email.toLowerCase() === email.toLowerCase() && 
            u.password === hashedPassword
        );
        
        if (!user) {
            return res.status(401).json({ 
                success: false,
                error: 'Invalid credentials'
            });
        }
        
        // Generate token
        const token = generateToken();
        
        // Return success with user data (excluding password)
        const { password: _, ...userWithoutPassword } = user;
        
        return res.status(200).json({
            success: true,
            token: token,
            user: userWithoutPassword,
            message: `Welcome ${user.name}!`
        });
        
    } catch (error) {
        console.error('Auth error:', error);
        return res.status(500).json({ 
            success: false,
            error: 'Authentication failed',
            details: error.message
        });
    }
};