// CRS Job Management System
// Practical tools for managing daily operations

const moment = require('moment');

class JobManager {
    
    // ==========================================
    // JOB LIFECYCLE
    // ==========================================
    
    // Create new job from quote
    async createJob(quote, scheduledDate) {
        const job = {
            reference: this.generateJobReference(),
            quoteReference: quote.reference,
            
            // Customer details
            companyName: quote.companyName,
            contactName: quote.contactName,
            phone: quote.phone,
            email: quote.email,
            
            // Location
            address: quote.address,
            postcode: quote.postcode,
            coordinates: await this.getCoordinates(quote.postcode),
            accessNotes: quote.accessNotes,
            
            // Job details
            zoneSize: quote.zoneSize,
            estimatedArea: quote.areaSqm,
            price: quote.finalPrice,
            
            // Schedule
            scheduledDate: scheduledDate,
            estimatedDuration: this.estimateDuration(quote.zoneSize),
            arrivalWindow: null, // Set day before
            
            // Status
            status: 'scheduled',
            createdAt: new Date(),
            
            // Work details (filled during job)
            actualStart: null,
            actualEnd: null,
            crew: [],
            materialsUsed: [],
            actualArea: null,
            
            // Documentation
            beforePhotos: [],
            duringPhotos: [],
            afterPhotos: [],
            customerSignature: null,
            
            // Weather
            weatherOnDay: null,
            weatherSuitable: true
        };
        
        // Store in database
        await this.saveJob(job);
        
        // Schedule notifications
        await this.scheduleNotifications(job);
        
        return job;
    }
    
    // ==========================================
    // SCHEDULING
    // ==========================================
    
    // Get optimal schedule for a date
    async getOptimalSchedule(date) {
        const jobs = await this.getJobsForDate(date);
        
        if (jobs.length === 0) return [];
        
        // Group jobs by proximity
        const clusters = this.clusterJobsByLocation(jobs);
        
        // Optimize route within each cluster
        const optimizedJobs = [];
        let currentTime = moment(date).hour(8).minute(0); // Start at 8am
        
        for (const cluster of clusters) {
            const route = this.optimizeRoute(cluster);
            
            for (const job of route) {
                job.arrivalTime = currentTime.format('HH:mm');
                job.departureTime = currentTime.add(job.estimatedDuration, 'hours').format('HH:mm');
                optimizedJobs.push(job);
            }
        }
        
        return optimizedJobs;
    }
    
    // Check if date has capacity
    async hasCapacity(date, zoneSize) {
        const jobs = await this.getJobsForDate(date);
        const totalHours = jobs.reduce((sum, job) => sum + job.estimatedDuration, 0);
        const newJobHours = this.estimateDuration(zoneSize);
        
        // Maximum 10 hours of work per day (8am - 6pm)
        return (totalHours + newJobHours) <= 10;
    }
    
    // Find next available date
    async findNextAvailable(postcode, zoneSize) {
        let date = moment().add(1, 'day');
        const maxDays = 30;
        
        for (let i = 0; i < maxDays; i++) {
            // Skip weekends
            if (date.day() === 0 || date.day() === 6) {
                date.add(1, 'day');
                continue;
            }
            
            if (await this.hasCapacity(date.toDate(), zoneSize)) {
                // Check if we have nearby jobs (for discount)
                const nearbyJobs = await this.getNearbyJobs(postcode, date.toDate());
                
                return {
                    date: date.toDate(),
                    hasProximityDiscount: nearbyJobs.length > 0,
                    capacity: 'available'
                };
            }
            
            date.add(1, 'day');
        }
        
        return null; // No availability in next 30 days
    }
    
    // ==========================================
    // ROUTE OPTIMIZATION
    // ==========================================
    
    // Simple route optimization using nearest neighbor
    optimizeRoute(jobs) {
        if (jobs.length <= 1) return jobs;
        
        const optimized = [];
        const remaining = [...jobs];
        
        // Start from depot (Coventry)
        let current = { coordinates: { lat: 52.4068, lng: -1.5197 } };
        
        while (remaining.length > 0) {
            // Find nearest job
            let nearestIndex = 0;
            let nearestDistance = Infinity;
            
            for (let i = 0; i < remaining.length; i++) {
                const distance = this.calculateDistance(
                    current.coordinates,
                    remaining[i].coordinates
                );
                
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestIndex = i;
                }
            }
            
            // Add nearest to optimized route
            current = remaining[nearestIndex];
            optimized.push(current);
            remaining.splice(nearestIndex, 1);
        }
        
        return optimized;
    }
    
    // Cluster jobs by location (for multi-crew days)
    clusterJobsByLocation(jobs) {
        const clusters = [];
        const maxClusterRadius = 5; // km
        
        for (const job of jobs) {
            let addedToCluster = false;
            
            for (const cluster of clusters) {
                const distance = this.calculateDistance(
                    job.coordinates,
                    cluster[0].coordinates
                );
                
                if (distance <= maxClusterRadius) {
                    cluster.push(job);
                    addedToCluster = true;
                    break;
                }
            }
            
            if (!addedToCluster) {
                clusters.push([job]);
            }
        }
        
        return clusters;
    }
    
    // ==========================================
    // JOB TRACKING
    // ==========================================
    
    // Update job status
    async updateJobStatus(reference, updates) {
        const job = await this.getJob(reference);
        
        Object.assign(job, updates);
        job.updatedAt = new Date();
        
        await this.saveJob(job);
        
        // Send relevant notifications
        if (updates.status === 'in_progress') {
            await this.sendArrivalNotification(job);
        } else if (updates.status === 'completed') {
            await this.sendCompletionNotification(job);
        }
        
        return job;
    }
    
    // Track crew location
    async updateCrewLocation(jobReference, coordinates) {
        const job = await this.getJob(jobReference);
        
        // Calculate ETA to job
        const distance = this.calculateDistance(coordinates, job.coordinates);
        const etaMinutes = Math.round(distance * 2); // Rough estimate: 2 min per km
        
        // Send notification if close
        if (etaMinutes <= 30 && !job.onWayNotificationSent) {
            await this.sendOnWayNotification(job, etaMinutes);
            job.onWayNotificationSent = true;
            await this.saveJob(job);
        }
        
        return { etaMinutes, distance };
    }
    
    // ==========================================
    // MATERIALS ESTIMATION
    // ==========================================
    
    estimateMaterials(zoneSize) {
        const materials = {
            small: {
                tarmac: '10 bags',
                sealant: '2 tubs',
                aggregate: '5 bags'
            },
            medium: {
                tarmac: '20 bags',
                sealant: '4 tubs',
                aggregate: '10 bags'
            },
            large: {
                tarmac: '40 bags',
                sealant: '8 tubs',
                aggregate: '20 bags'
            },
            xlarge: {
                tarmac: '60 bags',
                sealant: '12 tubs',
                aggregate: '30 bags'
            }
        };
        
        return materials[zoneSize] || materials.medium;
    }
    
    // Estimate job duration
    estimateDuration(zoneSize) {
        const durations = {
            small: 2,   // 2 hours
            medium: 3,  // 3 hours
            large: 5,   // 5 hours
            xlarge: 8   // 8 hours (full day)
        };
        
        return durations[zoneSize] || 3;
    }
    
    // ==========================================
    // REPORTING
    // ==========================================
    
    // Daily job summary
    async getDailySummary(date) {
        const jobs = await this.getJobsForDate(date);
        
        return {
            date,
            totalJobs: jobs.length,
            totalRevenue: jobs.reduce((sum, job) => sum + job.price, 0),
            totalHours: jobs.reduce((sum, job) => sum + job.estimatedDuration, 0),
            totalMileage: this.calculateRouteMileage(this.optimizeRoute(jobs)),
            
            byStatus: {
                scheduled: jobs.filter(j => j.status === 'scheduled').length,
                inProgress: jobs.filter(j => j.status === 'in_progress').length,
                completed: jobs.filter(j => j.status === 'completed').length
            },
            
            byZone: {
                small: jobs.filter(j => j.zoneSize === 'small').length,
                medium: jobs.filter(j => j.zoneSize === 'medium').length,
                large: jobs.filter(j => j.zoneSize === 'large').length,
                xlarge: jobs.filter(j => j.zoneSize === 'xlarge').length
            },
            
            materials: this.calculateTotalMaterials(jobs)
        };
    }
    
    // Weekly performance report
    async getWeeklyReport(weekStart) {
        const days = [];
        let totalRevenue = 0;
        let totalJobs = 0;
        
        for (let i = 0; i < 7; i++) {
            const date = moment(weekStart).add(i, 'days').toDate();
            const summary = await this.getDailySummary(date);
            
            days.push(summary);
            totalRevenue += summary.totalRevenue;
            totalJobs += summary.totalJobs;
        }
        
        return {
            weekStart,
            weekEnd: moment(weekStart).add(6, 'days').toDate(),
            totalJobs,
            totalRevenue,
            averageJobValue: totalJobs > 0 ? totalRevenue / totalJobs : 0,
            dailySummaries: days,
            topPostcodes: await this.getTopPostcodes(weekStart)
        };
    }
    
    // ==========================================
    // UTILITY FUNCTIONS
    // ==========================================
    
    generateJobReference() {
        const date = moment().format('YYMMDD');
        const random = Math.random().toString(36).substr(2, 4).toUpperCase();
        return `CRS-${date}-${random}`;
    }
    
    calculateDistance(coord1, coord2) {
        // Haversine formula for distance between coordinates
        const R = 6371; // Earth radius in km
        const dLat = this.toRad(coord2.lat - coord1.lat);
        const dLng = this.toRad(coord2.lng - coord1.lng);
        
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.toRad(coord1.lat)) * Math.cos(this.toRad(coord2.lat)) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }
    
    toRad(degrees) {
        return degrees * (Math.PI / 180);
    }
    
    calculateRouteMileage(jobs) {
        if (jobs.length === 0) return 0;
        
        let totalDistance = 0;
        const depot = { lat: 52.4068, lng: -1.5197 }; // Coventry
        
        // Distance from depot to first job
        totalDistance += this.calculateDistance(depot, jobs[0].coordinates);
        
        // Distance between jobs
        for (let i = 0; i < jobs.length - 1; i++) {
            totalDistance += this.calculateDistance(
                jobs[i].coordinates,
                jobs[i + 1].coordinates
            );
        }
        
        // Distance from last job back to depot
        totalDistance += this.calculateDistance(jobs[jobs.length - 1].coordinates, depot);
        
        return Math.round(totalDistance * 0.621371); // Convert km to miles
    }
    
    calculateTotalMaterials(jobs) {
        const totals = {
            tarmac: 0,
            sealant: 0,
            aggregate: 0
        };
        
        for (const job of jobs) {
            const materials = this.estimateMaterials(job.zoneSize);
            totals.tarmac += parseInt(materials.tarmac) || 0;
            totals.sealant += parseInt(materials.sealant) || 0;
            totals.aggregate += parseInt(materials.aggregate) || 0;
        }
        
        return totals;
    }
    
    // Mock database functions (replace with real DB)
    async saveJob(job) {
        console.log('Saving job:', job.reference);
        return job;
    }
    
    async getJob(reference) {
        console.log('Getting job:', reference);
        return {}; // Mock
    }
    
    async getJobsForDate(date) {
        console.log('Getting jobs for date:', date);
        return []; // Mock
    }
    
    async getNearbyJobs(postcode, date) {
        console.log('Getting nearby jobs:', postcode, date);
        return []; // Mock
    }
    
    async getCoordinates(postcode) {
        // Would use Google Maps Geocoding API
        return { lat: 52.4068, lng: -1.5197 }; // Mock Coventry coordinates
    }
    
    async getTopPostcodes(weekStart) {
        // Would query database for top postcodes
        return ['CV1', 'CV2', 'CV3']; // Mock
    }
}

module.exports = new JobManager();