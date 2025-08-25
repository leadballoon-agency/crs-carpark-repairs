module.exports = async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // Debug what we're receiving
    return res.status(200).json({
        method: req.method,
        headers: req.headers,
        body: req.body,
        bodyType: typeof req.body,
        rawBody: req.body ? JSON.stringify(req.body) : 'undefined',
        hasEmail: !!(req.body && req.body.email),
        hasPassword: !!(req.body && req.body.password)
    });
}