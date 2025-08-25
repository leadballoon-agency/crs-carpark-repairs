const crypto = require('crypto');

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
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
    
    // For demo, just return success with the user data
    const { email, password, name, company, phone } = req.body;
    
    const token = crypto.randomBytes(32).toString('hex');
    const user = {
        id: Date.now().toString(),
        email,
        name,
        company,
        phone,
        role: email === 'admin@crs.com' ? 'admin' : 'client',
        createdAt: new Date().toISOString()
    };
    
    res.status(200).json({ token, user });
}