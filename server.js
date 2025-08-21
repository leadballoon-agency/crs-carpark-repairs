// CRS Car Park Repair Services - Backend Server
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const sharp = require('sharp');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Import AI Detection Module
const PotholeDetectionAI = require('./ai-vision-integration');
const aiDetector = new PotholeDetectionAI();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Database connection (MongoDB or PostgreSQL)
const DATABASE_URL = process.env.DATABASE_URL || 'mongodb://localhost:27017/crs-repairs';

// Multer setup for image uploads
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb('Error: Images and videos only!');
        }
    }
});

// ==========================================
// API ENDPOINTS
// ==========================================

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'CRS Backend Running' });
});

// Upload and analyze pothole images (SIMULATED for demo)
app.post('/api/analyze', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image uploaded' });
        }

        // Process image with sharp
        const processedImage = await sharp(req.file.buffer)
            .resize(800, 600, { fit: 'inside' })
            .jpeg({ quality: 80 })
            .toBuffer();

        // Simulated analysis for demo
        const analysis = {
            id: generateQuoteId(),
            timestamp: new Date().toISOString(),
            location: req.body.location || null,
            potholes: [
                {
                    severity: 'high',
                    size: '1.2m x 0.8m',
                    depth: '8cm',
                    coordinates: { x: 234, y: 145 }
                },
                {
                    severity: 'medium',
                    size: '0.6m x 0.5m',
                    depth: '4cm',
                    coordinates: { x: 456, y: 234 }
                }
            ],
            totalArea: 156,
            estimatedCost: 2500,
            repairTime: '4-6 hours',
            weatherImpact: {
                current: 'Good conditions',
                forecast: 'Dry for next 48 hours',
                recommendation: 'Ideal time for repairs'
            },
            proximityDiscount: calculateProximityDiscount(req.body.location)
        };

        // Store in database
        await storeAnalysis(analysis);

        res.json(analysis);
    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({ error: 'Failed to analyze image' });
    }
});

// REAL AI Analysis endpoint (when API keys are configured)
app.post('/api/analyze-real', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image uploaded' });
        }

        // Check if AI APIs are configured
        if (!process.env.GOOGLE_VISION_API_KEY && !process.env.AZURE_VISION_API_KEY) {
            // Fall back to simulated analysis
            return res.status(503).json({ 
                error: 'AI service not configured',
                message: 'Using simulated analysis. Contact admin to enable real AI detection.',
                simulated: true
            });
        }

        // Use real AI detection
        const result = await aiDetector.detectPotholes(req.file.buffer);
        
        if (!result.success) {
            // Image was not a car park or detection failed
            return res.status(400).json({
                error: result.error,
                suggestion: 'Please upload a clear photo of your car park surface',
                detectedInstead: result.detectedContent,
                message: 'The AI detected this is not a car park photo. Nice try! 😊'
            });
        }
        
        // Calculate costs
        const costEstimate = aiDetector.estimateRepairCost(result.potholes);
        
        // Generate quote ID
        const quoteId = generateQuoteId();
        
        // Prepare full analysis
        const analysis = {
            id: quoteId,
            timestamp: new Date().toISOString(),
            location: req.body.location || null,
            ...result,
            quote: costEstimate,
            weatherImpact: await getWeatherImpact(req.body.location),
            proximityDiscount: calculateProximityDiscount(req.body.location),
            nextSteps: result.potholes.length > 0 
                ? 'We can schedule repairs within 48 hours'
                : 'Your car park is in good condition - schedule preventive maintenance?'
        };

        // Store in database
        await storeAnalysis(analysis);

        res.json(analysis);
        
    } catch (error) {
        console.error('Real AI analysis error:', error);
        
        // Fallback to manual review
        res.status(500).json({
            error: 'AI analysis temporarily unavailable',
            fallback: 'Your photo has been queued for manual expert review',
            quoteId: generateQuoteId(),
            estimatedResponse: 'Within 2 hours'
        });
    }
});

// Get quote by ID
app.get('/api/quote/:id', async (req, res) => {
    try {
        const quote = await getQuoteById(req.params.id);
        if (!quote) {
            return res.status(404).json({ error: 'Quote not found' });
        }
        res.json(quote);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve quote' });
    }
});

// Submit repair request
app.post('/api/request-repair', async (req, res) => {
    try {
        const { quoteId, contactDetails, preferredDate, sites } = req.body;
        
        const repairRequest = {
            id: generateRequestId(),
            quoteId,
            contactDetails,
            preferredDate,
            sites: sites || [req.body.location],
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        // Calculate multi-site discount if applicable
        if (sites && sites.length > 1) {
            repairRequest.multiSiteDiscount = calculateMultiSiteDiscount(sites);
        }

        await storeRepairRequest(repairRequest);
        
        // Send notification to CRS team
        await notifyCRSTeam(repairRequest);
        
        res.json({
            success: true,
            requestId: repairRequest.id,
            message: 'Repair request submitted successfully'
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to submit repair request' });
    }
});

// Track repair status
app.get('/api/track/:id', async (req, res) => {
    try {
        const status = await getRepairStatus(req.params.id);
        res.json(status);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get repair status' });
    }
});

// Enterprise portal - Multi-site management
app.post('/api/enterprise/sites', async (req, res) => {
    try {
        const { companyName, sites, contactDetails } = req.body;
        
        const enterpriseAccount = {
            id: generateEnterpriseId(),
            companyName,
            sites,
            contactDetails,
            volumeDiscount: calculateVolumeDiscount(sites.length),
            createdAt: new Date().toISOString()
        };

        await storeEnterpriseAccount(enterpriseAccount);
        
        res.json({
            success: true,
            accountId: enterpriseAccount.id,
            volumeDiscount: enterpriseAccount.volumeDiscount,
            message: `Enterprise account created for ${sites.length} sites`
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create enterprise account' });
    }
});

// Get nearby jobs for proximity pricing
app.get('/api/nearby-jobs', async (req, res) => {
    try {
        const { lat, lng, radius = 5 } = req.query;
        
        const nearbyJobs = await findNearbyJobs(lat, lng, radius);
        
        const proximityData = {
            nearbyJobs: nearbyJobs.length,
            potentialSavings: calculateProximitySavings(nearbyJobs),
            nextAvailable: getNextAvailableSlot(nearbyJobs)
        };
        
        res.json(proximityData);
    } catch (error) {
        res.status(500).json({ error: 'Failed to check nearby jobs' });
    }
});

// Admin endpoints (protected)
app.post('/api/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Verify credentials
        const admin = await verifyAdmin(username, password);
        if (!admin) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Generate JWT
        const token = jwt.sign(
            { id: admin.id, role: 'admin' },
            process.env.JWT_SECRET || 'crs-secret-key',
            { expiresIn: '24h' }
        );
        
        res.json({ token, admin: { id: admin.id, name: admin.name } });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

// Get all repair requests (admin only)
app.get('/api/admin/requests', authenticateAdmin, async (req, res) => {
    try {
        const requests = await getAllRepairRequests();
        res.json(requests);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get requests' });
    }
});

// Update repair status (admin only)
app.put('/api/admin/request/:id', authenticateAdmin, async (req, res) => {
    try {
        const { status, notes } = req.body;
        await updateRepairStatus(req.params.id, status, notes);
        res.json({ success: true, message: 'Status updated' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update status' });
    }
});

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function generateQuoteId() {
    return 'Q' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
}

function generateRequestId() {
    return 'R' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
}

function generateEnterpriseId() {
    return 'E' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
}

function calculateProximityDiscount(location) {
    // Check if we have jobs nearby
    // Return discount percentage
    return Math.random() > 0.7 ? 15 : 0; // Simulated
}

function calculateMultiSiteDiscount(sites) {
    if (sites.length >= 20) return 25;
    if (sites.length >= 10) return 20;
    if (sites.length >= 5) return 15;
    if (sites.length >= 3) return 10;
    return 5;
}

function calculateVolumeDiscount(siteCount) {
    if (siteCount >= 20) return 30;
    if (siteCount >= 10) return 25;
    if (siteCount >= 5) return 20;
    return 15;
}

function calculateProximitySavings(nearbyJobs) {
    if (nearbyJobs.length === 0) return 0;
    // Base savings when crew is already mobilized
    return 300 + (nearbyJobs.length * 50);
}

function getNextAvailableSlot(nearbyJobs) {
    // Calculate based on existing schedule
    const today = new Date();
    if (nearbyJobs.length > 0) {
        return 'Tomorrow - crew already in your area';
    }
    return 'Within 3 business days';
}

// Middleware for admin authentication
function authenticateAdmin(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'crs-secret-key');
        if (decoded.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        req.admin = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}

// Database functions (to be implemented with actual DB)
async function storeAnalysis(analysis) {
    // Store in MongoDB or PostgreSQL
    console.log('Storing analysis:', analysis.id);
}

async function getQuoteById(id) {
    // Retrieve from database
    return { id, mock: true };
}

async function storeRepairRequest(request) {
    // Store in database
    console.log('Storing repair request:', request.id);
}

async function notifyCRSTeam(request) {
    // Send email/SMS notification
    console.log('Notifying CRS team about request:', request.id);
}

async function getRepairStatus(id) {
    // Get from database
    return { 
        id, 
        status: 'scheduled',
        scheduledDate: '2024-01-15',
        estimatedTime: '09:00 AM'
    };
}

async function storeEnterpriseAccount(account) {
    // Store in database
    console.log('Storing enterprise account:', account.id);
}

async function findNearbyJobs(lat, lng, radius) {
    // Query database for nearby jobs
    return []; // Simulated
}

async function getWeatherImpact(location) {
    // Would integrate with weather API
    return {
        current: 'Good conditions',
        forecast: 'Dry for next 48 hours',
        recommendation: 'Ideal time for repairs'
    };
}

async function verifyAdmin(username, password) {
    // Check against database
    if (username === 'admin' && password === 'CRS2024!') {
        return { id: 1, name: 'Paul', username: 'admin' };
    }
    return null;
}

async function getAllRepairRequests() {
    // Get from database
    return [];
}

async function updateRepairStatus(id, status, notes) {
    // Update in database
    console.log(`Updating ${id} to ${status}`);
}

// Start server
app.listen(PORT, () => {
    console.log(`CRS Backend Server running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to view the site`);
});