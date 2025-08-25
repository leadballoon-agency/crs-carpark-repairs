module.exports = async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Test database connection
    let dbUrl = process.env.DATABASE_URL;
    
    // Clean up the DATABASE_URL in case it has extra formatting
    if (dbUrl) {
        // Remove 'psql ' prefix if present
        if (dbUrl.startsWith('psql ')) {
            dbUrl = dbUrl.substring(5);
        }
        
        // Remove surrounding quotes if present
        if ((dbUrl.startsWith("'") && dbUrl.endsWith("'")) || 
            (dbUrl.startsWith('"') && dbUrl.endsWith('"'))) {
            dbUrl = dbUrl.substring(1, dbUrl.length - 1);
        }
    }
    
    return res.status(200).json({
        status: 'API is working',
        database_configured: !!dbUrl,
        database_url_length: dbUrl ? dbUrl.length : 0,
        timestamp: new Date().toISOString(),
        message: dbUrl ? 'Database URL is configured' : 'DATABASE_URL environment variable is not set',
        url_format: dbUrl ? (dbUrl.startsWith('postgresql://') ? 'Valid PostgreSQL URL' : 'Invalid format') : 'Not set'
    });
}