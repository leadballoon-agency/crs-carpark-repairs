const { neon } = require('@neondatabase/serverless');
const crypto = require('crypto');

// Clean up the DATABASE_URL
function cleanDbUrl(url) {
    if (!url) return '';
    if (url.startsWith('psql ')) url = url.substring(5);
    if ((url.startsWith("'") && url.endsWith("'")) || 
        (url.startsWith('"') && url.endsWith('"'))) {
        url = url.substring(1, url.length - 1);
    }
    url = url.replace('&channel_binding=require', '');
    return url;
}

module.exports = async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // GET - Retrieve damage reports
    if (req.method === 'GET') {
        try {
            // Mock data for now (will use database when initialized)
            const reports = [
                {
                    id: 1,
                    date: new Date().toISOString(),
                    location: 'Birmingham City Centre',
                    address: '123 High Street, Birmingham B1 2XX',
                    zones: 3,
                    severity: 'high',
                    damageCount: 7,
                    estimatedCost: 6000,
                    status: 'pending',
                    contactName: 'John Smith',
                    contactEmail: 'john@example.com',
                    contactPhone: '07700 900000',
                    urgency: 'asap',
                    notes: 'Multiple potholes near entrance causing customer complaints'
                },
                {
                    id: 2,
                    date: new Date(Date.now() - 86400000).toISOString(),
                    location: 'Manchester Retail Park',
                    address: '456 Market Street, Manchester M1 3XX',
                    zones: 2,
                    severity: 'medium',
                    damageCount: 4,
                    estimatedCost: 4000,
                    status: 'reviewing',
                    contactName: 'Sarah Jones',
                    contactEmail: 'sarah@retailpark.com',
                    contactPhone: '07700 900111',
                    urgency: 'soon',
                    notes: 'Cracks developing in parking area B'
                }
            ];
            
            // Try database if available
            if (process.env.DATABASE_URL) {
                try {
                    const sql = neon(cleanDbUrl(process.env.DATABASE_URL));
                    const dbReports = await sql`
                        SELECT * FROM damage_reports 
                        ORDER BY created_at DESC 
                        LIMIT 50
                    `;
                    if (dbReports.length > 0) {
                        return res.status(200).json(dbReports);
                    }
                } catch (dbError) {
                    console.error('Database query error:', dbError);
                }
            }
            
            return res.status(200).json(reports);
            
        } catch (error) {
            return res.status(500).json({ 
                error: 'Failed to retrieve reports',
                message: error.message 
            });
        }
    }
    
    // POST - Submit new damage report
    if (req.method === 'POST') {
        try {
            const reportData = req.body;
            
            // Validate required fields
            if (!reportData.location || !reportData.contactEmail) {
                return res.status(400).json({ 
                    error: 'Missing required fields',
                    required: ['location', 'contactEmail']
                });
            }
            
            // Calculate estimated cost based on zones
            const zoneCount = reportData.zones || 1;
            let estimatedCost = 2000; // Base price
            if (zoneCount <= 10) {
                estimatedCost = 2000;
            } else if (zoneCount <= 30) {
                estimatedCost = 4000;
            } else {
                estimatedCost = 6000;
            }
            
            // Create report object
            const report = {
                id: Date.now(),
                ...reportData,
                estimatedCost,
                status: 'pending',
                createdAt: new Date().toISOString()
            };
            
            // Try to save to database
            if (process.env.DATABASE_URL) {
                try {
                    const sql = neon(cleanDbUrl(process.env.DATABASE_URL));
                    
                    // Get user ID if email exists
                    let userId = null;
                    const users = await sql`
                        SELECT id FROM users WHERE email = ${reportData.contactEmail}
                    `;
                    if (users.length > 0) {
                        userId = users[0].id;
                    }
                    
                    // Insert damage report
                    const result = await sql`
                        INSERT INTO damage_reports (
                            user_id,
                            zones_affected,
                            severity,
                            damage_data,
                            estimated_cost,
                            status,
                            notes
                        ) VALUES (
                            ${userId},
                            ${reportData.zones || 1},
                            ${reportData.severity || 'medium'},
                            ${JSON.stringify(reportData.damageData || {})}::jsonb,
                            ${estimatedCost},
                            'pending',
                            ${reportData.notes || ''}
                        )
                        RETURNING id
                    `;
                    
                    report.id = result[0].id;
                    report.saved = true;
                } catch (dbError) {
                    console.error('Database save error:', dbError);
                    report.saved = false;
                }
            }
            
            // Send email notification (in production, use email service)
            // For now, just log it
            console.log('New damage report submitted:', {
                id: report.id,
                location: report.location,
                email: report.contactEmail,
                zones: report.zones,
                estimatedCost: report.estimatedCost
            });
            
            return res.status(201).json({
                success: true,
                message: 'Damage report submitted successfully',
                reportId: report.id,
                estimatedCost: report.estimatedCost,
                status: 'pending',
                nextSteps: 'Our team will review your report and contact you within 24 hours'
            });
            
        } catch (error) {
            console.error('Submit report error:', error);
            return res.status(500).json({ 
                error: 'Failed to submit report',
                message: error.message 
            });
        }
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
}