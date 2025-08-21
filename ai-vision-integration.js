// Real AI Vision Integration for CRS
// This module connects to actual computer vision APIs for pothole detection

const axios = require('axios');
const sharp = require('sharp');

// ==========================================
// REAL AI VISION PROVIDERS
// ==========================================

class PotholeDetectionAI {
    constructor() {
        // Multiple AI providers for redundancy
        this.providers = {
            primary: {
                name: 'Google Vision AI',
                apiKey: process.env.GOOGLE_VISION_API_KEY,
                endpoint: 'https://vision.googleapis.com/v1/images:annotate'
            },
            secondary: {
                name: 'Azure Computer Vision',
                apiKey: process.env.AZURE_VISION_API_KEY,
                endpoint: 'https://westeurope.api.cognitive.microsoft.com/vision/v3.2/analyze'
            },
            specialized: {
                name: 'Roboflow (Pothole Model)',
                apiKey: process.env.ROBOFLOW_API_KEY,
                endpoint: 'https://detect.roboflow.com/pothole-detection-2/1'
            }
        };
        
        this.validationRules = {
            minConfidence: 0.7,
            minPotholeSize: 10, // cm
            maxPotholeSize: 500, // cm
            validSurfaces: ['asphalt', 'concrete', 'tarmac', 'pavement', 'road', 'parking'],
            invalidObjects: ['face', 'person', 'hair', 'animal', 'indoor', 'furniture']
        };
    }

    // ==========================================
    // IMAGE VALIDATION
    // ==========================================
    
    async validateImage(imageBuffer) {
        try {
            // Pre-process image
            const metadata = await sharp(imageBuffer).metadata();
            
            // Basic validations
            if (metadata.width < 640 || metadata.height < 480) {
                return {
                    valid: false,
                    reason: 'Image resolution too low. Please upload a clearer photo.'
                };
            }
            
            // Check if image is actually of a parking surface
            const sceneDetection = await this.detectScene(imageBuffer);
            
            if (!this.isValidParkingScene(sceneDetection)) {
                return {
                    valid: false,
                    reason: 'This doesn\'t appear to be a car park or road surface. Please upload a photo of the actual parking area.',
                    detected: sceneDetection.labels
                };
            }
            
            return { valid: true };
            
        } catch (error) {
            console.error('Image validation error:', error);
            return {
                valid: false,
                reason: 'Could not validate image. Please try again.'
            };
        }
    }
    
    // ==========================================
    // SCENE DETECTION
    // ==========================================
    
    async detectScene(imageBuffer) {
        // Use Google Vision to understand what's in the image
        try {
            const base64Image = imageBuffer.toString('base64');
            
            const response = await axios.post(
                `${this.providers.primary.endpoint}?key=${this.providers.primary.apiKey}`,
                {
                    requests: [{
                        image: { content: base64Image },
                        features: [
                            { type: 'LABEL_DETECTION', maxResults: 10 },
                            { type: 'OBJECT_LOCALIZATION', maxResults: 10 },
                            { type: 'SAFE_SEARCH_DETECTION' }
                        ]
                    }]
                }
            );
            
            const result = response.data.responses[0];
            
            return {
                labels: result.labelAnnotations?.map(l => l.description.toLowerCase()) || [],
                objects: result.localizedObjectAnnotations?.map(o => o.name.toLowerCase()) || [],
                safeSearch: result.safeSearchAnnotation
            };
            
        } catch (error) {
            console.error('Scene detection error:', error);
            // Fallback to basic detection
            return { labels: [], objects: [] };
        }
    }
    
    // ==========================================
    // VALIDATE PARKING SCENE
    // ==========================================
    
    isValidParkingScene(sceneData) {
        const { labels, objects } = sceneData;
        
        // Check for invalid content (like faces, people, indoor scenes)
        for (const invalid of this.validationRules.invalidObjects) {
            if (labels.includes(invalid) || objects.includes(invalid)) {
                console.log(`Invalid object detected: ${invalid}`);
                return false;
            }
        }
        
        // Check for valid parking/road surfaces
        let validSurfaceFound = false;
        for (const surface of this.validationRules.validSurfaces) {
            if (labels.some(label => label.includes(surface))) {
                validSurfaceFound = true;
                break;
            }
        }
        
        // Additional context clues
        const parkingIndicators = ['car', 'vehicle', 'outdoor', 'street', 'driveway'];
        const hasContextClues = parkingIndicators.some(indicator => 
            labels.includes(indicator) || objects.includes(indicator)
        );
        
        return validSurfaceFound || hasContextClues;
    }
    
    // ==========================================
    // POTHOLE DETECTION (REAL)
    // ==========================================
    
    async detectPotholes(imageBuffer) {
        // First validate the image
        const validation = await this.validateImage(imageBuffer);
        if (!validation.valid) {
            return {
                success: false,
                error: validation.reason,
                detectedContent: validation.detected
            };
        }
        
        try {
            // Use specialized pothole detection model (Roboflow)
            const base64Image = imageBuffer.toString('base64');
            
            const response = await axios.post(
                `${this.providers.specialized.endpoint}?api_key=${this.providers.specialized.apiKey}`,
                base64Image,
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );
            
            const detections = response.data.predictions || [];
            
            // Filter by confidence
            const validPotholes = detections.filter(d => 
                d.confidence >= this.validationRules.minConfidence
            );
            
            if (validPotholes.length === 0) {
                // Try with secondary provider
                return await this.detectWithAzure(imageBuffer);
            }
            
            // Convert to our format
            return {
                success: true,
                potholes: validPotholes.map(p => ({
                    id: `PH_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                    boundingBox: {
                        x: p.x,
                        y: p.y,
                        width: p.width,
                        height: p.height
                    },
                    confidence: p.confidence,
                    severity: this.calculateSeverity(p),
                    estimatedSize: this.estimateRealWorldSize(p, imageBuffer),
                    repairPriority: this.calculatePriority(p)
                })),
                metadata: {
                    detectionModel: 'Roboflow Pothole v1',
                    timestamp: new Date().toISOString(),
                    imageQuality: await this.assessImageQuality(imageBuffer)
                }
            };
            
        } catch (error) {
            console.error('Pothole detection error:', error);
            
            // Fallback to Azure
            return await this.detectWithAzure(imageBuffer);
        }
    }
    
    // ==========================================
    // AZURE FALLBACK
    // ==========================================
    
    async detectWithAzure(imageBuffer) {
        try {
            const response = await axios.post(
                this.providers.secondary.endpoint,
                imageBuffer,
                {
                    headers: {
                        'Ocp-Apim-Subscription-Key': this.providers.secondary.apiKey,
                        'Content-Type': 'application/octet-stream'
                    },
                    params: {
                        visualFeatures: 'Objects,Tags,Description',
                        details: 'Landmarks',
                        language: 'en'
                    }
                }
            );
            
            // Azure doesn't have specific pothole detection, 
            // so we look for damage indicators
            const damageIndicators = ['crack', 'damage', 'hole', 'broken', 'deterioration'];
            const objects = response.data.objects || [];
            const tags = response.data.tags || [];
            
            const potentialDamage = objects.filter(obj => 
                damageIndicators.some(indicator => 
                    obj.object?.toLowerCase().includes(indicator)
                )
            );
            
            if (potentialDamage.length === 0) {
                // No potholes detected with high confidence
                return {
                    success: true,
                    potholes: [],
                    message: 'No significant damage detected. Your car park appears to be in good condition!',
                    metadata: {
                        detectionModel: 'Azure Computer Vision (General)',
                        confidence: 'low',
                        recommendation: 'Consider manual inspection if you see issues'
                    }
                };
            }
            
            return {
                success: true,
                potholes: potentialDamage.map(d => ({
                    id: `PH_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                    boundingBox: d.rectangle,
                    confidence: d.confidence || 0.5,
                    severity: 'medium',
                    requiresManualVerification: true
                })),
                metadata: {
                    detectionModel: 'Azure Computer Vision',
                    requiresVerification: true
                }
            };
            
        } catch (error) {
            console.error('Azure detection error:', error);
            return {
                success: false,
                error: 'Could not complete AI analysis. Our team can review manually.',
                fallbackToManual: true
            };
        }
    }
    
    // ==========================================
    // SEVERITY CALCULATION
    // ==========================================
    
    calculateSeverity(detection) {
        // Based on size and detection confidence
        const area = detection.width * detection.height;
        const confidence = detection.confidence;
        
        if (area > 10000 && confidence > 0.9) return 'critical';
        if (area > 5000 && confidence > 0.8) return 'high';
        if (area > 2000 && confidence > 0.7) return 'medium';
        return 'low';
    }
    
    // ==========================================
    // SIZE ESTIMATION
    // ==========================================
    
    estimateRealWorldSize(detection, imageBuffer) {
        // This would use camera calibration or reference objects
        // For now, rough estimation based on typical parking space dimensions
        
        const typicalParkingWidth = 250; // cm
        const imageWidth = 1920; // assumed
        const pixelToCm = typicalParkingWidth / imageWidth;
        
        return {
            width: Math.round(detection.width * pixelToCm),
            height: Math.round(detection.height * pixelToCm),
            area: Math.round(detection.width * detection.height * pixelToCm * pixelToCm),
            unit: 'cm',
            accuracy: 'estimated'
        };
    }
    
    // ==========================================
    // PRIORITY CALCULATION
    // ==========================================
    
    calculatePriority(detection) {
        const severity = this.calculateSeverity(detection);
        const severityScores = { critical: 4, high: 3, medium: 2, low: 1 };
        
        // Location-based priority (center of image = high traffic area)
        const centerDistance = Math.sqrt(
            Math.pow(detection.x - 0.5, 2) + 
            Math.pow(detection.y - 0.5, 2)
        );
        const locationScore = centerDistance < 0.3 ? 2 : 1;
        
        return severityScores[severity] + locationScore;
    }
    
    // ==========================================
    // IMAGE QUALITY ASSESSMENT
    // ==========================================
    
    async assessImageQuality(imageBuffer) {
        const metadata = await sharp(imageBuffer).metadata();
        const stats = await sharp(imageBuffer).stats();
        
        // Check for blur, lighting, etc.
        const brightness = stats.channels[0].mean;
        const contrast = stats.channels[0].stdev;
        
        let quality = 'good';
        if (brightness < 50 || brightness > 200) quality = 'poor lighting';
        if (contrast < 20) quality = 'low contrast';
        if (metadata.width < 1280) quality = 'low resolution';
        
        return quality;
    }
    
    // ==========================================
    // BATCH PROCESSING
    // ==========================================
    
    async processBatch(images) {
        const results = [];
        
        for (const image of images) {
            const result = await this.detectPotholes(image.buffer);
            results.push({
                filename: image.filename,
                ...result
            });
            
            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        return results;
    }
    
    // ==========================================
    // COST ESTIMATION
    // ==========================================
    
    estimateRepairCost(potholes) {
        if (!potholes || potholes.length === 0) {
            return {
                totalCost: 2000, // Minimum
                breakdown: 'Minimum call-out charge for inspection'
            };
        }
        
        let totalArea = 0;
        let criticalCount = 0;
        
        for (const pothole of potholes) {
            if (pothole.estimatedSize) {
                totalArea += pothole.estimatedSize.area;
            }
            if (pothole.severity === 'critical') {
                criticalCount++;
            }
        }
        
        // Convert to square meters
        const areaSqm = totalArea / 10000;
        
        // Base cost calculation
        let cost = Math.max(2000, areaSqm * 25); // £25 per sqm
        
        // Add complexity factors
        if (criticalCount > 0) {
            cost *= 1.2; // 20% increase for critical repairs
        }
        
        return {
            totalCost: Math.round(cost),
            breakdown: {
                area: `${areaSqm.toFixed(2)} sqm`,
                potholeCount: potholes.length,
                criticalRepairs: criticalCount,
                baseRate: '£25/sqm',
                minimumCharge: '£2000'
            }
        };
    }
}

// ==========================================
// EXPORT FOR USE IN SERVER
// ==========================================

module.exports = PotholeDetectionAI;

// ==========================================
// USAGE EXAMPLE
// ==========================================

/*
const detector = new PotholeDetectionAI();

// In your Express route:
app.post('/api/analyze-real', upload.single('image'), async (req, res) => {
    try {
        const result = await detector.detectPotholes(req.file.buffer);
        
        if (!result.success) {
            // Image was not a car park or detection failed
            return res.status(400).json({
                error: result.error,
                suggestion: 'Please upload a clear photo of your car park surface',
                detectedInstead: result.detectedContent
            });
        }
        
        // Calculate costs
        const costEstimate = detector.estimateRepairCost(result.potholes);
        
        res.json({
            ...result,
            quote: costEstimate,
            nextSteps: result.potholes.length > 0 
                ? 'We can schedule repairs within 48 hours'
                : 'Your car park is in good condition'
        });
        
    } catch (error) {
        res.status(500).json({
            error: 'Analysis failed',
            fallback: 'Our team will review your submission manually'
        });
    }
});
*/