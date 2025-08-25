export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Test database connection
    const dbUrl = process.env.DATABASE_URL;
    
    return res.status(200).json({
        status: 'API is working',
        database_configured: !!dbUrl,
        database_url_length: dbUrl ? dbUrl.length : 0,
        timestamp: new Date().toISOString(),
        message: dbUrl ? 'Database URL is configured' : 'DATABASE_URL environment variable is not set'
    });
}