// Proximity & Route Optimization Pricing
// Smart pricing based on location clustering and route efficiency

class ProximityPricing {
    constructor() {
        this.locations = [];
        this.clusters = [];
        this.init();
    }

    init() {
        // Check for proximity opportunities
        this.detectNearbyJobs();
        this.setupProximityUI();
    }

    detectNearbyJobs() {
        // Check if user is near existing jobs
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                this.checkProximityDiscounts(position.coords);
            });
        }
    }

    checkProximityDiscounts(coords) {
        // Simulate checking against scheduled jobs
        const nearbyJobs = this.getNearbyScheduledJobs(coords);
        
        if (nearbyJobs.length > 0) {
            this.showProximityOffer(nearbyJobs);
        }
    }

    getNearbyScheduledJobs(coords) {
        // In reality, this would check CRS database
        // Simulating nearby jobs
        return [
            { location: "McDonald's Coventry", distance: 0.5, date: "Tuesday" },
            { location: "Tesco Express", distance: 1.2, date: "Tuesday" },
            { location: "BP Garage", distance: 2.1, date: "Wednesday" }
        ];
    }

    showProximityOffer(nearbyJobs) {
        const banner = document.createElement('div');
        banner.className = 'proximity-banner';
        banner.innerHTML = `
            <div class="proximity-content">
                <div class="proximity-alert">
                    <span class="proximity-icon">🚛</span>
                    <div class="proximity-message">
                        <strong>Save 30% - We're Already in Your Area!</strong>
                        <p>Our crew is working at ${nearbyJobs[0].location} on ${nearbyJobs[0].date}</p>
                    </div>
                </div>
                <button type="button" class="proximity-cta" id="proximityBookBtn">
                    Book Same Day - Save £${this.calculateSavings()}
                </button>
            </div>
        `;
        
        // Insert at top of page
        document.body.insertBefore(banner, document.body.firstChild);
        
        // Add handler
        document.getElementById('proximityBookBtn')?.addEventListener('click', () => {
            this.bookProximityJob(nearbyJobs[0]);
        });
    }

    calculateSavings() {
        // Base job £2,400
        // Proximity discount 30%
        return Math.floor(2400 * 0.3);
    }

    bookProximityJob(nearbyJob) {
        this.showProximityBooking(nearbyJob);
    }

    showProximityBooking(nearbyJob) {
        const modal = document.createElement('div');
        modal.className = 'proximity-modal';
        modal.innerHTML = `
            <div class="proximity-booking">
                <h2>Smart Scheduling Discount</h2>
                <div class="savings-explanation">
                    <h3>Why You Save:</h3>
                    <div class="saving-item">
                        <span class="icon">🚛</span>
                        <div>
                            <strong>No Extra Mobilization</strong>
                            <p>Vehicles already on-site nearby</p>
                        </div>
                    </div>
                    <div class="saving-item">
                        <span class="icon">👷</span>
                        <div>
                            <strong>Crew Already Deployed</strong>
                            <p>Team finishing at ${nearbyJob.location}</p>
                        </div>
                    </div>
                    <div class="saving-item">
                        <span class="icon">🛠️</span>
                        <div>
                            <strong>Equipment Ready</strong>
                            <p>Hot mix already prepared</p>
                        </div>
                    </div>
                </div>
                
                <div class="proximity-quote">
                    <div class="price-breakdown">
                        <div class="price-line">
                            <span>Standard Price</span>
                            <span class="crossed">£2,400</span>
                        </div>
                        <div class="price-line highlight">
                            <span>Proximity Discount (30%)</span>
                            <span>-£720</span>
                        </div>
                        <div class="price-line total">
                            <span>Your Price</span>
                            <span>£1,680</span>
                        </div>
                    </div>
                    
                    <div class="availability">
                        <strong>Available Time Slots ${nearbyJob.date}:</strong>
                        <div class="time-slots">
                            <button class="time-slot">2:00 PM - 4:00 PM</button>
                            <button class="time-slot">4:00 PM - 6:00 PM</button>
                            <button class="time-slot">After 6:00 PM</button>
                        </div>
                    </div>
                </div>
                
                <button class="book-proximity-btn">
                    Lock In This Price - ${nearbyJob.date}
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    setupProximityUI() {
        // Add route optimization display
        this.addRouteVisualization();
    }

    addRouteVisualization() {
        // Check if on enterprise portal
        const portal = document.querySelector('.enterprise-portal');
        if (!portal) return;
        
        const routeSection = document.createElement('div');
        routeSection.className = 'route-optimization';
        routeSection.innerHTML = `
            <h3>Route Optimization Savings</h3>
            <div class="route-map">
                <div class="route-explanation">
                    <p><strong>How clustering saves you money:</strong></p>
                    <ul>
                        <li>Sites within 5 miles: <strong>20% discount</strong></li>
                        <li>Same-day service: <strong>30% discount</strong></li>
                        <li>10+ sites in area: <strong>35% discount</strong></li>
                    </ul>
                </div>
                <div class="cluster-visual">
                    <svg viewBox="0 0 400 300" class="cluster-map">
                        <!-- Cluster 1: Coventry -->
                        <circle cx="100" cy="100" r="40" fill="rgba(255, 107, 53, 0.2)" stroke="#FF6B35" stroke-width="2"/>
                        <text x="100" y="105" text-anchor="middle" font-weight="bold">5 sites</text>
                        <text x="100" y="120" text-anchor="middle" font-size="12">Coventry</text>
                        
                        <!-- Cluster 2: Birmingham -->
                        <circle cx="250" cy="150" r="50" fill="rgba(255, 107, 53, 0.2)" stroke="#FF6B35" stroke-width="2"/>
                        <text x="250" y="155" text-anchor="middle" font-weight="bold">8 sites</text>
                        <text x="250" y="170" text-anchor="middle" font-size="12">Birmingham</text>
                        
                        <!-- Cluster 3: Leicester -->
                        <circle cx="180" cy="220" r="35" fill="rgba(255, 107, 53, 0.2)" stroke="#FF6B35" stroke-width="2"/>
                        <text x="180" y="225" text-anchor="middle" font-weight="bold">4 sites</text>
                        <text x="180" y="240" text-anchor="middle" font-size="12">Leicester</text>
                        
                        <!-- Route lines -->
                        <path d="M100,100 L250,150 L180,220" fill="none" stroke="#003366" stroke-width="2" stroke-dasharray="5,5"/>
                    </svg>
                </div>
            </div>
            <div class="cluster-savings">
                <div class="cluster-card">
                    <h4>Coventry Cluster</h4>
                    <p>5 McDonald's locations</p>
                    <p class="saving">Save £3,500 vs individual visits</p>
                </div>
                <div class="cluster-card">
                    <h4>Birmingham Cluster</h4>
                    <p>8 McDonald's locations</p>
                    <p class="saving">Save £5,600 vs individual visits</p>
                </div>
                <div class="cluster-card">
                    <h4>Leicester Cluster</h4>
                    <p>4 McDonald's locations</p>
                    <p class="saving">Save £2,800 vs individual visits</p>
                </div>
            </div>
            <div class="total-route-savings">
                <strong>Total Route Optimization Savings: £11,900</strong>
                <p>By scheduling all locations efficiently</p>
            </div>
        `;
        
        portal.appendChild(routeSection);
    }

    // Calculate multi-site proximity discounts
    calculateMultiSiteDiscount(sites) {
        const clusters = this.clusterSitesByProximity(sites);
        let totalDiscount = 0;
        
        clusters.forEach(cluster => {
            if (cluster.sites.length >= 10) {
                totalDiscount += 0.35; // 35% off
            } else if (cluster.sites.length >= 5) {
                totalDiscount += 0.30; // 30% off
            } else if (cluster.sites.length >= 2) {
                totalDiscount += 0.20; // 20% off
            }
        });
        
        return totalDiscount;
    }

    clusterSitesByProximity(sites) {
        // Group sites by proximity (within 5 miles)
        // Simplified clustering algorithm
        const clusters = [];
        const maxDistance = 5; // miles
        
        sites.forEach(site => {
            let addedToCluster = false;
            
            clusters.forEach(cluster => {
                if (this.getDistance(site, cluster.center) < maxDistance) {
                    cluster.sites.push(site);
                    addedToCluster = true;
                }
            });
            
            if (!addedToCluster) {
                clusters.push({
                    center: site,
                    sites: [site]
                });
            }
        });
        
        return clusters;
    }

    getDistance(site1, site2) {
        // Simplified distance calculation
        // In reality would use Haversine formula with lat/lng
        return Math.random() * 10; // Random for demo
    }

    // Show economies of scale
    showBulkSavings(siteCount) {
        const savings = {
            1: 0,
            2: 0.10,  // 10% off second site
            5: 0.20,  // 20% off for 5+ sites
            10: 0.30, // 30% off for 10+ sites
            20: 0.35, // 35% off for 20+ sites
            50: 0.40  // 40% off for 50+ sites
        };
        
        let discount = 0;
        Object.keys(savings).forEach(threshold => {
            if (siteCount >= parseInt(threshold)) {
                discount = savings[threshold];
            }
        });
        
        return discount;
    }

    // Seasonal batch pricing
    showSeasonalBatching() {
        const modal = document.createElement('div');
        modal.className = 'seasonal-modal';
        modal.innerHTML = `
            <div class="seasonal-content">
                <h2>Pre-Winter Batch Service</h2>
                <div class="seasonal-offer">
                    <div class="offer-header">
                        <span class="season-icon">❄️</span>
                        <h3>Book All Sites Before Winter</h3>
                    </div>
                    
                    <div class="batch-benefits">
                        <div class="benefit-item">
                            <strong>October Batch (Book Now)</strong>
                            <ul>
                                <li>40% discount on labor</li>
                                <li>All sites completed before frost</li>
                                <li>Priority scheduling</li>
                                <li>Weather guarantee included</li>
                            </ul>
                            <div class="price">£45,000 for all 23 sites</div>
                        </div>
                        
                        <div class="benefit-item">
                            <strong>November Batch</strong>
                            <ul>
                                <li>25% discount on labor</li>
                                <li>Weather permitting</li>
                                <li>Standard scheduling</li>
                            </ul>
                            <div class="price">£52,000 for all 23 sites</div>
                        </div>
                        
                        <div class="benefit-item">
                            <strong>Spring 2025</strong>
                            <ul>
                                <li>Standard pricing</li>
                                <li>After winter damage</li>
                                <li>Higher material costs</li>
                            </ul>
                            <div class="price">£78,000 for all 23 sites</div>
                        </div>
                    </div>
                    
                    <div class="urgency-message">
                        <strong>⏰ October batch closes in 7 days</strong>
                        <p>Lock in lowest price of the year</p>
                    </div>
                    
                    <button class="batch-book-btn">
                        Reserve October Batch - Save £33,000
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
}

// Add styles
const proximityStyles = document.createElement('style');
proximityStyles.textContent = `
    .proximity-banner {
        background: linear-gradient(135deg, #10B981, #059669);
        color: white;
        padding: 1rem;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 1001;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        animation: slideDown 0.5s ease;
    }
    
    @keyframes slideDown {
        from {
            transform: translateY(-100%);
        }
        to {
            transform: translateY(0);
        }
    }
    
    .proximity-content {
        max-width: 1200px;
        margin: 0 auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;
    }
    
    .proximity-alert {
        display: flex;
        align-items: center;
        gap: 1rem;
    }
    
    .proximity-icon {
        font-size: 2rem;
    }
    
    .proximity-message strong {
        display: block;
        font-size: 1.1rem;
        margin-bottom: 0.25rem;
    }
    
    .proximity-message p {
        font-size: 0.9rem;
        opacity: 0.95;
    }
    
    .proximity-cta {
        background: white;
        color: #10B981;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        font-weight: bold;
        cursor: pointer;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        transition: transform 0.2s;
    }
    
    .proximity-cta:hover {
        transform: translateY(-2px);
    }
    
    .proximity-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 1rem;
    }
    
    .proximity-booking {
        background: white;
        border-radius: 16px;
        padding: 2rem;
        max-width: 600px;
        width: 100%;
    }
    
    .proximity-booking h2 {
        color: #003366;
        margin-bottom: 1.5rem;
        text-align: center;
    }
    
    .savings-explanation {
        background: #F0FDF4;
        padding: 1.5rem;
        border-radius: 8px;
        margin-bottom: 1.5rem;
    }
    
    .savings-explanation h3 {
        color: #10B981;
        margin-bottom: 1rem;
    }
    
    .saving-item {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
    }
    
    .saving-item .icon {
        font-size: 1.5rem;
    }
    
    .saving-item strong {
        display: block;
        color: #003366;
    }
    
    .saving-item p {
        font-size: 0.9rem;
        color: #6B7280;
        margin-top: 0.25rem;
    }
    
    .proximity-quote {
        background: #F9FAFB;
        padding: 1.5rem;
        border-radius: 8px;
        margin-bottom: 1.5rem;
    }
    
    .price-breakdown {
        margin-bottom: 1.5rem;
    }
    
    .price-line {
        display: flex;
        justify-content: space-between;
        padding: 0.5rem 0;
        border-bottom: 1px solid #E5E7EB;
    }
    
    .price-line.highlight {
        color: #10B981;
        font-weight: bold;
    }
    
    .price-line.total {
        border-bottom: none;
        border-top: 2px solid #003366;
        margin-top: 0.5rem;
        padding-top: 1rem;
        font-size: 1.2rem;
        font-weight: bold;
        color: #003366;
    }
    
    .crossed {
        text-decoration: line-through;
        color: #9CA3AF;
    }
    
    .time-slots {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 0.75rem;
        margin-top: 0.75rem;
    }
    
    .time-slot {
        padding: 0.75rem;
        background: white;
        border: 2px solid #E5E7EB;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .time-slot:hover {
        border-color: #10B981;
        background: #F0FDF4;
    }
    
    .book-proximity-btn {
        width: 100%;
        padding: 1rem;
        background: #10B981;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 1.1rem;
        font-weight: bold;
        cursor: pointer;
    }
    
    /* Route Optimization Styles */
    .route-optimization {
        background: white;
        padding: 2rem;
        border-radius: 12px;
        margin-top: 2rem;
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }
    
    .route-optimization h3 {
        color: #003366;
        margin-bottom: 1.5rem;
    }
    
    .route-map {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
        margin-bottom: 1.5rem;
    }
    
    .route-explanation ul {
        list-style: none;
        padding: 0;
    }
    
    .route-explanation li {
        padding: 0.5rem 0;
        color: #1A1A1A;
    }
    
    .cluster-visual {
        display: flex;
        justify-content: center;
    }
    
    .cluster-map {
        max-width: 100%;
        height: auto;
    }
    
    .cluster-savings {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin-bottom: 1.5rem;
    }
    
    .cluster-card {
        background: #F9FAFB;
        padding: 1rem;
        border-radius: 8px;
        text-align: center;
    }
    
    .cluster-card h4 {
        color: #003366;
        margin-bottom: 0.5rem;
    }
    
    .cluster-card .saving {
        color: #10B981;
        font-weight: bold;
        margin-top: 0.5rem;
    }
    
    .total-route-savings {
        background: linear-gradient(135deg, #10B981, #059669);
        color: white;
        padding: 1.5rem;
        border-radius: 8px;
        text-align: center;
    }
    
    .total-route-savings strong {
        font-size: 1.5rem;
        display: block;
        margin-bottom: 0.5rem;
    }
    
    /* Seasonal Batching */
    .seasonal-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 1rem;
    }
    
    .seasonal-content {
        background: white;
        border-radius: 16px;
        padding: 2rem;
        max-width: 800px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
    }
    
    .offer-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1.5rem;
    }
    
    .season-icon {
        font-size: 3rem;
    }
    
    .batch-benefits {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin-bottom: 1.5rem;
    }
    
    .benefit-item {
        background: #F9FAFB;
        padding: 1.5rem;
        border-radius: 8px;
        border: 2px solid transparent;
    }
    
    .benefit-item:first-child {
        border-color: #10B981;
        background: #F0FDF4;
    }
    
    .benefit-item strong {
        display: block;
        color: #003366;
        margin-bottom: 0.75rem;
    }
    
    .benefit-item ul {
        list-style: none;
        padding: 0;
        margin-bottom: 1rem;
    }
    
    .benefit-item li {
        padding: 0.25rem 0;
        font-size: 0.9rem;
    }
    
    .benefit-item .price {
        font-size: 1.25rem;
        font-weight: bold;
        color: #FF6B35;
        text-align: center;
        padding-top: 1rem;
        border-top: 1px solid #E5E7EB;
    }
    
    .urgency-message {
        background: #FEF3C7;
        border: 2px solid #F59E0B;
        padding: 1rem;
        border-radius: 8px;
        text-align: center;
        margin-bottom: 1.5rem;
    }
    
    .batch-book-btn {
        width: 100%;
        padding: 1.25rem;
        background: #10B981;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 1.1rem;
        font-weight: bold;
        cursor: pointer;
    }
    
    @media (max-width: 768px) {
        .route-map {
            grid-template-columns: 1fr;
        }
        
        .batch-benefits {
            grid-template-columns: 1fr;
        }
    }
`;
document.head.appendChild(proximityStyles);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.proximityPricing = new ProximityPricing();
});