// MongoDB Schemas for CRS Car Park Repair Services
const mongoose = require('mongoose');

// ==========================================
// CUSTOMER SCHEMA
// ==========================================
const customerSchema = new mongoose.Schema({
    companyName: String,
    contactName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: String,
    address: String,
    customerType: { 
        type: String, 
        enum: ['standard', 'enterprise', 'franchise'],
        default: 'standard'
    },
    sites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Site' }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// ==========================================
// SITE SCHEMA
// ==========================================
const siteSchema = new mongoose.Schema({
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    siteName: { type: String, required: true },
    address: { type: String, required: true },
    postcode: String,
    location: {
        type: { type: String, default: 'Point' },
        coordinates: [Number] // [longitude, latitude]
    },
    siteType: {
        type: String,
        enum: ['retail', 'office', 'industrial', 'residential', 'hospitality']
    },
    parkingSpaces: Number,
    totalAreaSqm: Number,
    lastInspection: Date,
    maintenanceSchedule: {
        frequency: String, // 'monthly', 'quarterly', 'annual'
        nextDue: Date
    },
    createdAt: { type: Date, default: Date.now }
});

// Add geospatial index for proximity searches
siteSchema.index({ location: '2dsphere' });

// ==========================================
// ASSESSMENT/QUOTE SCHEMA
// ==========================================
const assessmentSchema = new mongoose.Schema({
    quoteId: { type: String, required: true, unique: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    siteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Site' },
    
    // Media uploads
    images: [{
        url: String,
        uploadedAt: Date,
        analysisComplete: Boolean
    }],
    videos: [{
        url: String,
        duration: Number,
        framesExtracted: Number,
        uploadedAt: Date
    }],
    
    // AI Analysis Results
    aiAnalysis: {
        modelVersion: String,
        detectionConfidence: Number,
        potholes: [{
            boundingBox: {
                x: Number,
                y: Number,
                width: Number,
                height: Number
            },
            severity: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
            estimatedSize: {
                width: Number,
                length: Number,
                depth: Number,
                unit: { type: String, default: 'cm' }
            },
            repairPriority: Number,
            confidence: Number
        }],
        processedAt: Date
    },
    
    // Quote Details
    potholeCount: Number,
    totalAreaSqm: Number,
    severityScore: { type: Number, min: 1, max: 10 },
    
    // Pricing
    baseCost: Number,
    proximityDiscount: {
        applicable: Boolean,
        percentage: Number,
        reason: String
    },
    multiSiteDiscount: {
        applicable: Boolean,
        percentage: Number,
        sites: Number
    },
    volumeDiscount: {
        applicable: Boolean,
        percentage: Number,
        totalArea: Number
    },
    finalQuote: Number,
    
    // Weather Impact
    weatherAnalysis: {
        currentConditions: String,
        forecast: [{
            date: Date,
            condition: String,
            suitability: String
        }],
        deteriorationRisk: String,
        recommendedTimeframe: String
    },
    
    // Validity
    quoteValidUntil: Date,
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'expired', 'converted'],
        default: 'pending'
    },
    
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// ==========================================
// REPAIR JOB SCHEMA
// ==========================================
const repairJobSchema = new mongoose.Schema({
    jobId: { type: String, required: true, unique: true },
    assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment' },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    siteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Site' },
    
    // Scheduling
    scheduledDate: Date,
    scheduledTime: String,
    estimatedDuration: Number, // hours
    crew: [{
        memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'CrewMember' },
        role: String
    }],
    
    // Job Status
    status: {
        type: String,
        enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'postponed'],
        default: 'scheduled'
    },
    actualStart: Date,
    actualEnd: Date,
    
    // Work Details
    materialsUsed: [{
        material: String,
        quantity: Number,
        unit: String,
        cost: Number
    }],
    repairsCompleted: [{
        potholeId: String,
        repairMethod: String,
        areaCovered: Number,
        depthFilled: Number,
        completed: Boolean
    }],
    
    // Documentation
    beforePhotos: [String],
    duringPhotos: [String],
    afterPhotos: [String],
    customerSignature: String,
    completionCertificate: String,
    
    // Financial
    laborCost: Number,
    materialCost: Number,
    totalCost: Number,
    invoiceId: String,
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'overdue', 'partial'],
        default: 'pending'
    },
    
    // Notes & Feedback
    crewNotes: String,
    customerNotes: String,
    issues: [{
        description: String,
        resolution: String,
        reportedAt: Date
    }],
    
    // Weather on day
    weatherOnDay: {
        temperature: Number,
        conditions: String,
        suitable: Boolean
    },
    
    createdAt: { type: Date, default: Date.now },
    completedAt: Date,
    updatedAt: { type: Date, default: Date.now }
});

// ==========================================
// ENTERPRISE ACCOUNT SCHEMA
// ==========================================
const enterpriseAccountSchema = new mongoose.Schema({
    accountId: { type: String, required: true, unique: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    
    // Contract Details
    contractStart: Date,
    contractEnd: Date,
    contractValue: Number,
    
    // Sites Management
    sites: [{
        siteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Site' },
        priority: Number,
        maintenanceFrequency: String,
        lastServiced: Date,
        nextDue: Date
    }],
    totalSites: Number,
    
    // Discounts & Terms
    volumeDiscount: Number,
    paymentTerms: {
        type: String,
        enum: ['immediate', 'net15', 'net30', 'net60'],
        default: 'net30'
    },
    creditLimit: Number,
    currentBalance: Number,
    
    // Account Management
    accountManager: String,
    primaryContact: {
        name: String,
        email: String,
        phone: String
    },
    authorizedContacts: [{
        name: String,
        email: String,
        phone: String,
        canApprove: Boolean
    }],
    
    // Performance Metrics
    totalJobsCompleted: Number,
    totalSpend: Number,
    averageResponseTime: Number, // hours
    satisfactionScore: Number,
    
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// ==========================================
// CREW MEMBER SCHEMA
// ==========================================
const crewMemberSchema = new mongoose.Schema({
    name: { type: String, required: true },
    employeeId: String,
    role: {
        type: String,
        enum: ['supervisor', 'technician', 'driver', 'apprentice'],
        required: true
    },
    contact: {
        phone: String,
        email: String,
        emergencyContact: String
    },
    
    // Availability
    schedule: {
        workDays: [String], // ['Monday', 'Tuesday', ...]
        shift: String, // 'day', 'night', 'flexible'
        currentStatus: {
            type: String,
            enum: ['available', 'on_job', 'break', 'off_duty'],
            default: 'available'
        }
    },
    
    // Skills & Certifications
    skills: [String],
    certifications: [{
        name: String,
        issueDate: Date,
        expiryDate: Date
    }],
    
    // Performance
    jobsCompleted: Number,
    averageRating: Number,
    punctualityScore: Number,
    
    // Location Tracking
    lastKnownLocation: {
        type: { type: String, default: 'Point' },
        coordinates: [Number],
        timestamp: Date
    },
    
    active: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

// ==========================================
// ROUTE OPTIMIZATION SCHEMA
// ==========================================
const routeSchema = new mongoose.Schema({
    routeDate: { type: Date, required: true },
    crewIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CrewMember' }],
    
    // Route Planning
    stops: [{
        order: Number,
        jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'RepairJob' },
        siteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Site' },
        estimatedArrival: Date,
        estimatedDuration: Number, // minutes
        actualArrival: Date,
        actualDeparture: Date,
        distanceFromPrevious: Number, // km
        status: {
            type: String,
            enum: ['pending', 'en_route', 'arrived', 'working', 'completed'],
            default: 'pending'
        }
    }],
    
    // Route Metrics
    totalDistance: Number, // km
    estimatedDuration: Number, // hours
    actualDuration: Number,
    fuelCost: Number,
    efficiencyScore: Number,
    
    // Proximity Opportunities
    nearbyOpportunities: [{
        siteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Site' },
        distance: Number, // km from route
        potentialRevenue: Number,
        contacted: Boolean,
        converted: Boolean
    }],
    
    status: {
        type: String,
        enum: ['planned', 'active', 'completed', 'cancelled'],
        default: 'planned'
    },
    
    createdAt: { type: Date, default: Date.now },
    completedAt: Date
});

// ==========================================
// NOTIFICATION SCHEMA
// ==========================================
const notificationSchema = new mongoose.Schema({
    recipientType: {
        type: String,
        enum: ['customer', 'crew', 'admin'],
        required: true
    },
    recipientId: mongoose.Schema.Types.ObjectId,
    
    // Notification Details
    type: {
        type: String,
        enum: ['quote_ready', 'job_scheduled', 'crew_dispatch', 'job_complete', 'payment_due', 'proximity_offer'],
        required: true
    },
    channel: {
        type: String,
        enum: ['email', 'sms', 'push', 'in_app'],
        required: true
    },
    
    // Content
    subject: String,
    message: { type: String, required: true },
    data: mongoose.Schema.Types.Mixed, // Additional data
    
    // Tracking
    status: {
        type: String,
        enum: ['pending', 'sent', 'delivered', 'read', 'failed'],
        default: 'pending'
    },
    sentAt: Date,
    deliveredAt: Date,
    readAt: Date,
    error: String,
    
    // Scheduling
    scheduledFor: Date,
    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal'
    },
    
    createdAt: { type: Date, default: Date.now }
});

// ==========================================
// FEEDBACK SCHEMA
// ==========================================
const feedbackSchema = new mongoose.Schema({
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'RepairJob', required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    
    // Ratings
    overallRating: { type: Number, min: 1, max: 5, required: true },
    qualityRating: { type: Number, min: 1, max: 5 },
    timelinessRating: { type: Number, min: 1, max: 5 },
    professionalismRating: { type: Number, min: 1, max: 5 },
    valueRating: { type: Number, min: 1, max: 5 },
    
    // Feedback
    wouldRecommend: Boolean,
    comment: String,
    improvements: String,
    
    // Follow-up
    requiresFollowUp: Boolean,
    followUpNotes: String,
    followUpCompleted: Boolean,
    
    // Verification
    verified: { type: Boolean, default: false },
    verificationMethod: String,
    
    createdAt: { type: Date, default: Date.now }
});

// Export models
module.exports = {
    Customer: mongoose.model('Customer', customerSchema),
    Site: mongoose.model('Site', siteSchema),
    Assessment: mongoose.model('Assessment', assessmentSchema),
    RepairJob: mongoose.model('RepairJob', repairJobSchema),
    EnterpriseAccount: mongoose.model('EnterpriseAccount', enterpriseAccountSchema),
    CrewMember: mongoose.model('CrewMember', crewMemberSchema),
    Route: mongoose.model('Route', routeSchema),
    Notification: mongoose.model('Notification', notificationSchema),
    Feedback: mongoose.model('Feedback', feedbackSchema)
};