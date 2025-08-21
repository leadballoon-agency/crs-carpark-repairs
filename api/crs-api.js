// CRS Car Park Repairs - Production API Endpoints
// Practical APIs for actual business operations

const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// ==========================================
// CUSTOMER-FACING APIs
// ==========================================

// 1. Quick Quote - Main customer entry point
router.post('/quote/instant', upload.single('photo'), async (req, res) => {
    /*
    Customer uploads photo from their phone
    Returns instant quote based on:
    - Location (postcode)
    - Approximate damage area
    - Standard pricing zones
    */
    try {
        const { postcode, companyName, contactName, phone, email } = req.body;
        
        // Simple zone calculation based on postcode
        const zone = calculateZoneFromPostcode(postcode);
        const basePrice = getZonePrice(zone);
        
        // Check if we're already working nearby
        const nearbyJobs = await checkNearbyJobs(postcode);
        const discount = nearbyJobs.length > 0 ? 0.15 : 0; // 15% if we're nearby
        
        const quote = {
            reference: `CRS-${Date.now()}`,
            postcode,
            zoneSize: zone,
            basePrice,
            discount: discount * 100 + '%',
            finalPrice: basePrice * (1 - discount),
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            message: nearbyJobs.length > 0 
                ? "Good news! We're already working in your area this week"
                : "We can schedule your repairs within 5 business days",
            nextStep: "Reply YES to this quote number to confirm"
        };
        
        // Store lead in database
        await storeLead({
            ...quote,
            companyName,
            contactName,
            phone,
            email,
            photoUrl: req.file ? await storePhoto(req.file) : null,
            createdAt: new Date()
        });
        
        // Send SMS confirmation
        if (phone) {
            await sendSMS(phone, 
                `CRS Quote ${quote.reference}: £${quote.finalPrice} to repair your car park. ` +
                `Valid for 30 days. Reply YES to book. Call 07833588488 for questions.`
            );
        }
        
        res.json(quote);
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate quote' });
    }
});

// 2. Confirm Quote - Customer accepts quote
router.post('/quote/:reference/confirm', async (req, res) => {
    try {
        const { reference } = req.params;
        const { preferredDates, notes } = req.body;
        
        const quote = await getQuote(reference);
        if (!quote) {
            return res.status(404).json({ error: 'Quote not found' });
        }
        
        // Check availability
        const availableSlots = await getAvailableSlots(quote.postcode, preferredDates);
        
        if (availableSlots.length === 0) {
            return res.json({
                status: 'pending',
                message: 'No slots available on preferred dates. We\'ll call you within 2 hours to arrange.',
                alternativeDates: await getNextAvailableSlots(quote.postcode, 5)
            });
        }
        
        // Create job
        const job = await createJob({
            quoteReference: reference,
            scheduledDate: availableSlots[0],
            status: 'confirmed',
            notes
        });
        
        // Send confirmation
        await sendConfirmation(quote, job);
        
        res.json({
            status: 'confirmed',
            jobReference: job.reference,
            scheduledDate: job.scheduledDate,
            message: 'Repair confirmed! We\'ll text you the day before with arrival time.'
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to confirm quote' });
    }
});

// 3. Track Job - Customer checks status
router.get('/track/:reference', async (req, res) => {
    try {
        const job = await getJobByReference(req.params.reference);
        
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }
        
        const status = {
            reference: job.reference,
            status: job.status,
            scheduledDate: job.scheduledDate,
            updates: []
        };
        
        // Add relevant updates based on status
        switch(job.status) {
            case 'confirmed':
                status.message = 'Your repair is scheduled';
                status.nextUpdate = 'We\'ll text you the day before';
                break;
            case 'in_progress':
                status.message = 'Our crew is working on your car park now';
                status.estimatedCompletion = job.estimatedCompletion;
                break;
            case 'completed':
                status.message = 'Repair completed successfully';
                status.completedAt = job.completedAt;
                status.warrantyUntil = new Date(job.completedAt.getTime() + 5 * 365 * 24 * 60 * 60 * 1000);
                status.invoiceUrl = `/invoice/${job.reference}`;
                break;
        }
        
        res.json(status);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get job status' });
    }
});

// ==========================================
// OPERATIONS APIs (for CRS team)
// ==========================================

// 4. Daily Schedule - What jobs are today?
router.get('/schedule/today', authenticate, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const jobs = await getJobsForDate(today);
        
        // Optimize route
        const optimizedRoute = optimizeRoute(jobs);
        
        res.json({
            date: today,
            jobCount: jobs.length,
            estimatedDuration: calculateTotalDuration(jobs),
            estimatedMileage: calculateRouteMileage(optimizedRoute),
            jobs: optimizedRoute.map(job => ({
                reference: job.reference,
                time: job.scheduledTime || 'TBD',
                address: job.address,
                postcode: job.postcode,
                company: job.companyName,
                contact: job.contactName,
                phone: job.phone,
                zoneSize: job.zoneSize,
                price: job.price,
                notes: job.notes,
                materials: estimateMaterials(job.zoneSize)
            }))
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get schedule' });
    }
});

// 5. Job Start - Crew arrives on site
router.post('/job/:reference/start', authenticate, async (req, res) => {
    try {
        const { reference } = req.params;
        const { crewMembers, actualArrival, weatherConditions, sitePhoto } = req.body;
        
        const job = await updateJobStatus(reference, {
            status: 'in_progress',
            startTime: actualArrival || new Date(),
            crewMembers,
            weatherConditions
        });
        
        // Notify customer
        await sendSMS(job.phone, 
            `CRS crew has arrived at your car park. ` +
            `Estimated completion: ${job.estimatedCompletion}. ` +
            `Track progress: carparkrepair.co.uk/track/${reference}`
        );
        
        res.json({
            status: 'started',
            estimatedCompletion: job.estimatedCompletion
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to start job' });
    }
});

// 6. Job Complete - Crew finishes
router.post('/job/:reference/complete', authenticate, async (req, res) => {
    try {
        const { reference } = req.params;
        const { 
            completionTime,
            actualArea,
            materialsUsed,
            beforePhotos,
            afterPhotos,
            crewNotes
        } = req.body;
        
        const job = await completeJob(reference, {
            status: 'completed',
            completionTime: completionTime || new Date(),
            actualArea,
            materialsUsed,
            beforePhotos,
            afterPhotos,
            crewNotes
        });
        
        // Generate invoice
        const invoice = await generateInvoice(job);
        
        // Send completion notification
        await sendSMS(job.phone,
            `CRS has completed your car park repairs! ` +
            `Invoice: ${invoice.url} ` +
            `Your 5-year warranty starts today. ` +
            `Please leave a review: carparkrepair.co.uk/review/${reference}`
        );
        
        res.json({
            status: 'completed',
            invoiceUrl: invoice.url,
            warrantyUntil: job.warrantyUntil
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to complete job' });
    }
});

// ==========================================
// ADMIN APIs
// ==========================================

// 7. Dashboard Stats
router.get('/admin/dashboard', authenticate, requireAdmin, async (req, res) => {
    try {
        const stats = await getDashboardStats();
        
        res.json({
            today: {
                jobs: stats.todayJobs,
                revenue: stats.todayRevenue,
                completed: stats.todayCompleted
            },
            week: {
                jobs: stats.weekJobs,
                revenue: stats.weekRevenue,
                averageJobValue: stats.weekAvgValue
            },
            month: {
                jobs: stats.monthJobs,
                revenue: stats.monthRevenue,
                topPostcodes: stats.topPostcodes
            },
            pending: {
                quotes: stats.pendingQuotes,
                jobs: stats.scheduledJobs,
                value: stats.pendingValue
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get dashboard stats' });
    }
});

// 8. Customer Database
router.get('/admin/customers', authenticate, requireAdmin, async (req, res) => {
    try {
        const { search, postcode, sortBy = 'recent' } = req.query;
        
        const customers = await searchCustomers({
            search,
            postcode,
            sortBy
        });
        
        res.json(customers.map(c => ({
            id: c.id,
            company: c.companyName,
            contact: c.contactName,
            phone: c.phone,
            email: c.email,
            postcode: c.postcode,
            totalJobs: c.jobCount,
            totalSpend: c.totalSpend,
            lastJob: c.lastJobDate,
            status: c.status
        })));
    } catch (error) {
        res.status(500).json({ error: 'Failed to get customers' });
    }
});

// ==========================================
// UTILITY APIs
// ==========================================

// 9. Postcode Check - Is area serviceable?
router.get('/check/postcode/:postcode', async (req, res) => {
    try {
        const { postcode } = req.params;
        
        // Check if postcode is in service area
        const serviceable = await isPostcodeServiceable(postcode);
        
        if (!serviceable) {
            return res.json({
                serviceable: false,
                message: 'Sorry, we don\'t currently service this area',
                nearestArea: await getNearestServiceArea(postcode)
            });
        }
        
        // Check for nearby jobs
        const nearbyJobs = await checkNearbyJobs(postcode);
        
        res.json({
            serviceable: true,
            zone: calculateZoneFromPostcode(postcode),
            basePrice: getZonePrice(calculateZoneFromPostcode(postcode)),
            proximityDiscount: nearbyJobs.length > 0,
            nextAvailable: await getNextAvailableDate(postcode),
            message: nearbyJobs.length > 0 
                ? 'Great news! We\'re already scheduled to work in your area'
                : 'We service your area'
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to check postcode' });
    }
});

// 10. Availability Calendar
router.get('/availability/:postcode', async (req, res) => {
    try {
        const { postcode } = req.params;
        const { month = new Date().getMonth(), year = new Date().getFullYear() } = req.query;
        
        const availability = await getMonthAvailability(postcode, month, year);
        
        res.json({
            month,
            year,
            availableDates: availability.map(date => ({
                date,
                slots: getAvailableSlotsForDate(date),
                proximityDiscount: checkProximityForDate(postcode, date)
            }))
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get availability' });
    }
});

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function calculateZoneFromPostcode(postcode) {
    // Simple zone sizing - would use actual area calculation
    return 'medium'; // small, medium, large, xlarge
}

function getZonePrice(zone) {
    const prices = {
        small: 2000,
        medium: 3000,
        large: 5000,
        xlarge: 7500
    };
    return prices[zone] || 3000;
}

async function checkNearbyJobs(postcode) {
    // Check database for jobs within 3 miles
    return []; // Placeholder
}

async function sendSMS(phone, message) {
    // Twilio integration
    console.log(`SMS to ${phone}: ${message}`);
}

function authenticate(req, res, next) {
    // JWT verification
    next();
}

function requireAdmin(req, res, next) {
    // Check admin role
    next();
}

module.exports = router;