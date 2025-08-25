// GoHighLevel Integration for CRS
// This file handles all webhook communications with GHL

const https = require('https');

// GHL Configuration
const GHL_CONFIG = {
    location_id: 'YOUR_GHL_LOCATION_ID',
    api_key: 'YOUR_GHL_API_KEY',
    webhook_url: 'YOUR_GHL_WEBHOOK_URL'
};

// Send data to GHL webhook
function sendToGHL(eventType, data) {
    const payload = JSON.stringify({
        event: eventType,
        timestamp: new Date().toISOString(),
        data: data
    });
    
    const options = {
        hostname: 'services.leadconnectorhq.com',
        path: `/webhooks/YOUR_WEBHOOK_ID`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': payload.length
        }
    };
    
    const req = https.request(options, (res) => {
        console.log(`GHL Response: ${res.statusCode}`);
    });
    
    req.on('error', (error) => {
        console.error('GHL Error:', error);
    });
    
    req.write(payload);
    req.end();
}

// CRS Event Handlers
const ghlEvents = {
    // New client registration
    newClient: (userData) => {
        sendToGHL('contact_created', {
            email: userData.email,
            firstName: userData.name.split(' ')[0],
            lastName: userData.name.split(' ')[1] || '',
            phone: userData.phone,
            company: userData.company,
            tags: ['crs-portal', 'new-client'],
            source: 'Portal Registration',
            customField: {
                portal_user_id: userData.id,
                registration_date: userData.createdAt
            }
        });
    },
    
    // Damage report submitted
    damageReport: (reportData) => {
        sendToGHL('damage_report_submitted', {
            contactEmail: reportData.userEmail,
            location: reportData.siteName,
            address: reportData.siteAddress,
            severity: reportData.severity || 'standard',
            photoCount: reportData.photos?.length || 0,
            estimatedZones: reportData.zones || 1,
            estimatedValue: reportData.zones * 2000,
            reportUrl: `https://crs-portal.com/reports/${reportData.id}`,
            tags: reportData.emergency ? ['emergency', 'urgent'] : ['standard'],
            customField: {
                report_id: reportData.id,
                submitted_at: reportData.timestamp
            }
        });
    },
    
    // Emergency repair request
    emergencyRepair: (emergencyData) => {
        sendToGHL('emergency_repair', {
            priority: 'URGENT',
            contactEmail: emergencyData.userEmail,
            location: emergencyData.location,
            issue: emergencyData.description,
            safetyRisk: emergencyData.safetyRisk || false,
            contactPhone: emergencyData.phone,
            tags: ['emergency', '24hr-response', 'high-priority'],
            triggerSMS: true, // Tell GHL to send immediate SMS
            escalation: true  // Enable escalation workflow
        });
    },
    
    // Quote sent to client
    quoteSent: (quoteData) => {
        sendToGHL('quote_sent', {
            contactEmail: quoteData.clientEmail,
            quoteNumber: quoteData.quoteId,
            amount: quoteData.totalAmount,
            zones: quoteData.zones,
            validUntil: quoteData.expiryDate,
            pdfUrl: quoteData.pdfUrl,
            tags: ['quote-sent', `value-${Math.floor(quoteData.totalAmount/1000)}k`],
            customField: {
                quote_id: quoteData.quoteId,
                site_location: quoteData.location
            }
        });
    },
    
    // Quote approved
    quoteApproved: (approvalData) => {
        sendToGHL('quote_approved', {
            contactEmail: approvalData.clientEmail,
            quoteNumber: approvalData.quoteId,
            amount: approvalData.amount,
            scheduledDate: approvalData.proposedDate,
            tags: ['quote-approved', 'ready-to-schedule'],
            moveToStage: 'Approved', // Move in GHL pipeline
            createTask: {
                title: `Schedule job for ${approvalData.location}`,
                dueDate: approvalData.proposedDate,
                assignedTo: 'operations-team'
            }
        });
    },
    
    // Job completed
    jobCompleted: (jobData) => {
        sendToGHL('job_completed', {
            contactEmail: jobData.clientEmail,
            jobId: jobData.jobId,
            location: jobData.location,
            completedZones: jobData.zones,
            invoiceAmount: jobData.amount,
            warrantyExpiry: jobData.warrantyDate,
            tags: ['job-complete', 'send-invoice'],
            customField: {
                job_id: jobData.jobId,
                completion_date: jobData.completedAt,
                warranty_years: 5
            },
            triggerInvoice: true,
            satisfactionSurvey: true
        });
    },
    
    // Payment overdue
    paymentOverdue: (invoiceData) => {
        sendToGHL('payment_overdue', {
            contactEmail: invoiceData.clientEmail,
            invoiceNumber: invoiceData.invoiceId,
            amount: invoiceData.amount,
            daysOverdue: invoiceData.daysOverdue,
            tags: [`overdue-${invoiceData.daysOverdue}days`],
            escalationLevel: invoiceData.daysOverdue > 30 ? 'high' : 'standard'
        });
    },
    
    // Onboarding started
    onboardingStarted: (onboardingData) => {
        sendToGHL('onboarding_started', {
            email: onboardingData.email,
            company: onboardingData.company,
            sitesCount: onboardingData.sites?.length || 0,
            estimatedValue: onboardingData.estimatedMonthlyValue,
            tags: ['onboarding', 'new-lead'],
            createOpportunity: {
                name: `${onboardingData.company} - Onboarding`,
                value: onboardingData.estimatedMonthlyValue * 12,
                stage: 'Onboarding',
                source: 'Portal'
            }
        });
    }
};

// Integration with existing CRS backend
function integrateWithCRS(app) {
    // Add GHL webhook endpoint to receive data FROM GHL
    app.post('/api/webhooks/ghl', (req, res) => {
        const { event, data } = req.body;
        
        console.log('Received from GHL:', event);
        
        // Handle GHL events (like appointment scheduled, etc)
        switch(event) {
            case 'appointment_scheduled':
                // Update CRS database with appointment
                break;
            case 'contact_updated':
                // Sync contact changes back to CRS
                break;
            case 'task_completed':
                // Update job status in CRS
                break;
        }
        
        res.json({ received: true });
    });
    
    // Middleware to trigger GHL events
    app.use((req, res, next) => {
        // Store original json method
        const originalJson = res.json;
        
        // Override json method to intercept responses
        res.json = function(data) {
            // Check for events to send to GHL
            if (req.path === '/api/auth/register' && res.statusCode === 200) {
                ghlEvents.newClient(data.user);
            }
            
            if (req.path === '/api/damage-report' && res.statusCode === 200) {
                ghlEvents.damageReport(data.report);
            }
            
            if (req.path === '/api/quotes' && req.method === 'POST') {
                ghlEvents.quoteSent(data.quote);
            }
            
            // Call original json method
            return originalJson.call(this, data);
        };
        
        next();
    });
}

module.exports = {
    ghlEvents,
    sendToGHL,
    integrateWithCRS,
    GHL_CONFIG
};