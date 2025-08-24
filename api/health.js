// Health check endpoint
module.exports = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        message: 'CRS API is running'
    });
};