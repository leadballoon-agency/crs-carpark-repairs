// Enterprise Portal for Multi-Site Management
// For franchise owners with multiple locations

class EnterprisePortal {
    constructor() {
        this.sites = [];
        this.totalValue = 0;
        this.init();
    }

    init() {
        // Check if enterprise user (could be from URL param, cookie, etc)
        this.checkEnterpriseAccess();
    }

    checkEnterpriseAccess() {
        // Look for enterprise trigger
        const urlParams = new URLSearchParams(window.location.search);
        const isEnterprise = urlParams.get('enterprise') || urlParams.get('multi');
        const siteCount = urlParams.get('sites');
        
        // Or check for multi-site mention in referrer
        if (isEnterprise || siteCount > 1 || this.detectEnterpriseUser()) {
            this.showEnterpriseOption();
        }
    }

    detectEnterpriseUser() {
        // Smart detection based on behavior
        const previousVisits = localStorage.getItem('crs_visits') || 0;
        const hasMultipleUploads = localStorage.getItem('crs_multi_interest');
        
        return previousVisits > 3 || hasMultipleUploads;
    }

    showEnterpriseOption() {
        // Create enterprise banner at top of page
        const banner = document.createElement('div');
        banner.className = 'enterprise-banner';
        banner.innerHTML = `
            <div class="enterprise-content">
                <div class="enterprise-message">
                    <strong>Managing Multiple Locations?</strong>
                    <span>Get all your sites assessed and fixed with one contract</span>
                </div>
                <button type="button" class="enterprise-cta" id="enterpriseBtn">
                    Manage All My Sites →
                </button>
            </div>
        `;
        
        // Insert after header
        const header = document.querySelector('.site-header');
        if (header) {
            header.after(banner);
        }
        
        // Add handler
        document.getElementById('enterpriseBtn')?.addEventListener('click', () => {
            this.launchEnterprisePortal();
        });
    }

    launchEnterprisePortal() {
        // Replace main content with enterprise portal
        const mainContent = document.querySelector('.hero');
        if (!mainContent) return;
        
        mainContent.innerHTML = `
            <div class="enterprise-portal">
                <div class="portal-header">
                    <h1>Enterprise Car Park Management</h1>
                    <p>Manage all your locations from one dashboard</p>
                </div>
                
                <div class="quick-setup">
                    <h2>Let's Get Started</h2>
                    <div class="setup-options">
                        <button type="button" class="setup-card" id="bulkUploadBtn">
                            <span class="setup-icon">📁</span>
                            <h3>Bulk Upload</h3>
                            <p>Upload photos from all sites at once</p>
                        </button>
                        
                        <button type="button" class="setup-card" id="spreadsheetBtn">
                            <span class="setup-icon">📊</span>
                            <h3>Import Spreadsheet</h3>
                            <p>Upload your site list (CSV/Excel)</p>
                        </button>
                        
                        <button type="button" class="setup-card" id="manualEntryBtn">
                            <span class="setup-icon">📝</span>
                            <h3>Quick Entry</h3>
                            <p>Type or paste your locations</p>
                        </button>
                    </div>
                </div>
                
                <div class="instant-form" id="instantForm" style="display: none;">
                    <h3>Tell us about your sites</h3>
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Company/Franchise Name</label>
                            <input type="text" id="companyName" placeholder="e.g., McDonald's Franchisee Group">
                        </div>
                        
                        <div class="form-group">
                            <label>Number of Locations</label>
                            <input type="number" id="siteCount" placeholder="e.g., 23" min="2">
                        </div>
                        
                        <div class="form-group">
                            <label>Your Name</label>
                            <input type="text" id="contactName" placeholder="John Smith">
                        </div>
                        
                        <div class="form-group">
                            <label>Best Contact Number</label>
                            <input type="tel" id="contactPhone" placeholder="07XXX XXXXXX">
                        </div>
                        
                        <div class="form-group full-width">
                            <label>Location List (one per line or comma separated)</label>
                            <textarea id="locations" rows="6" placeholder="McDonald's Birmingham High Street
McDonald's Coventry Retail Park
McDonald's Leicester City Centre
...or paste from spreadsheet"></textarea>
                        </div>
                        
                        <div class="form-group full-width">
                            <label>Urgency</label>
                            <div class="urgency-options">
                                <label class="urgency-option">
                                    <input type="radio" name="urgency" value="immediate">
                                    <span>Immediate - This Week</span>
                                </label>
                                <label class="urgency-option">
                                    <input type="radio" name="urgency" value="planned">
                                    <span>Planned - This Month</span>
                                </label>
                                <label class="urgency-option">
                                    <input type="radio" name="urgency" value="budget">
                                    <span>Budget Planning - Quote Needed</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    <button type="button" class="submit-btn" id="getQuoteBtn">
                        Get Portfolio Quote →
                    </button>
                </div>
                
                <div class="benefits-grid">
                    <div class="benefit">
                        <span class="benefit-icon">💰</span>
                        <h4>Volume Discount</h4>
                        <p>Save 20-30% with multi-site contracts</p>
                    </div>
                    <div class="benefit">
                        <span class="benefit-icon">📊</span>
                        <h4>Single Invoice</h4>
                        <p>One monthly invoice for all locations</p>
                    </div>
                    <div class="benefit">
                        <span class="benefit-icon">👨‍💼</span>
                        <h4>Account Manager</h4>
                        <p>Dedicated contact for all sites</p>
                    </div>
                    <div class="benefit">
                        <span class="benefit-icon">📱</span>
                        <h4>Priority Response</h4>
                        <p>24/7 emergency line for all locations</p>
                    </div>
                </div>
            </div>
        `;
        
        // Add styles
        this.injectEnterpriseStyles();
        
        // Setup handlers
        this.setupEnterpriseHandlers();
    }

    setupEnterpriseHandlers() {
        // Manual entry button
        document.getElementById('manualEntryBtn')?.addEventListener('click', () => {
            document.getElementById('instantForm').style.display = 'block';
            document.getElementById('instantForm').scrollIntoView({ behavior: 'smooth' });
        });
        
        // Bulk upload button
        document.getElementById('bulkUploadBtn')?.addEventListener('click', () => {
            this.handleBulkUpload();
        });
        
        // Spreadsheet button
        document.getElementById('spreadsheetBtn')?.addEventListener('click', () => {
            this.handleSpreadsheetUpload();
        });
        
        // Get quote button
        document.getElementById('getQuoteBtn')?.addEventListener('click', () => {
            this.processEnterpriseQuote();
        });
        
        // Auto-detect paste from Excel
        document.getElementById('locations')?.addEventListener('paste', (e) => {
            setTimeout(() => {
                const text = e.target.value;
                if (text.includes('\t') || text.includes('\n')) {
                    // Likely pasted from Excel
                    this.parseExcelPaste(text);
                }
            }, 100);
        });
    }

    handleBulkUpload() {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = 'image/*';
        
        input.onchange = (e) => {
            const files = Array.from(e.target.files);
            this.processBulkPhotos(files);
        };
        
        input.click();
    }

    handleSpreadsheetUpload() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv,.xlsx,.xls';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            this.processSpreadsheet(file);
        };
        
        input.click();
    }

    processBulkPhotos(files) {
        // Show processing UI
        this.showProcessingModal(files.length);
        
        // Process each photo
        files.forEach((file, index) => {
            // Simulate processing
            setTimeout(() => {
                this.sites.push({
                    name: `Location ${index + 1}`,
                    photo: file,
                    status: 'analyzed',
                    issues: Math.floor(Math.random() * 10) + 3,
                    quote: Math.floor(Math.random() * 3000) + 2000
                });
                
                this.updateProcessingProgress(index + 1, files.length);
            }, 500 * index);
        });
    }

    processEnterpriseQuote() {
        const companyName = document.getElementById('companyName').value;
        const siteCount = document.getElementById('siteCount').value;
        const contactName = document.getElementById('contactName').value;
        const contactPhone = document.getElementById('contactPhone').value;
        const locations = document.getElementById('locations').value;
        const urgency = document.querySelector('input[name="urgency"]:checked')?.value;
        
        if (!contactPhone || !siteCount) {
            alert('Please provide contact details and number of sites');
            return;
        }
        
        // Show instant response
        this.showInstantQuote({
            company: companyName,
            sites: siteCount,
            locations: locations.split('\n').filter(l => l.trim()),
            urgency,
            contact: { name: contactName, phone: contactPhone }
        });
    }

    showInstantQuote(data) {
        // Calculate estimates
        const avgPerSite = 3500;
        const volumeDiscount = data.sites > 10 ? 0.25 : 0.15;
        const subtotal = data.sites * avgPerSite;
        const discount = subtotal * volumeDiscount;
        const total = subtotal - discount;
        const monthly = Math.floor(total / 12);
        
        // Create quote modal
        const modal = document.createElement('div');
        modal.className = 'quote-modal';
        modal.innerHTML = `
            <div class="quote-content">
                <div class="quote-header">
                    <h2>Your Enterprise Quote</h2>
                    <p>Preliminary estimate for ${data.sites} locations</p>
                </div>
                
                <div class="quote-summary">
                    <div class="quote-line">
                        <span>Base Service (${data.sites} sites × £${avgPerSite})</span>
                        <span>£${subtotal.toLocaleString()}</span>
                    </div>
                    <div class="quote-line discount">
                        <span>Volume Discount (${Math.round(volumeDiscount * 100)}%)</span>
                        <span>-£${discount.toLocaleString()}</span>
                    </div>
                    <div class="quote-line total">
                        <span>Annual Contract Value</span>
                        <span>£${total.toLocaleString()}</span>
                    </div>
                    <div class="quote-line monthly">
                        <span>Monthly Payment Option</span>
                        <span>£${monthly.toLocaleString()}/month</span>
                    </div>
                </div>
                
                <div class="quote-includes">
                    <h3>Your Enterprise Package Includes:</h3>
                    <ul>
                        <li>✓ All ${data.sites} locations covered</li>
                        <li>✓ Quarterly scheduled maintenance</li>
                        <li>✓ 24/7 emergency response</li>
                        <li>✓ Dedicated account manager</li>
                        <li>✓ Monthly reporting dashboard</li>
                        <li>✓ 5-year warranty on all repairs</li>
                        <li>✓ Priority scheduling</li>
                        <li>✓ Consolidated monthly invoice</li>
                    </ul>
                </div>
                
                <div class="quote-timeline">
                    <h3>Next Steps:</h3>
                    <div class="timeline-item">
                        <span class="timeline-number">1</span>
                        <div>
                            <strong>Today</strong>
                            <p>Account manager calls within 2 hours</p>
                        </div>
                    </div>
                    <div class="timeline-item">
                        <span class="timeline-number">2</span>
                        <div>
                            <strong>This Week</strong>
                            <p>Site assessments scheduled</p>
                        </div>
                    </div>
                    <div class="timeline-item">
                        <span class="timeline-number">3</span>
                        <div>
                            <strong>Next Week</strong>
                            <p>Work begins at priority locations</p>
                        </div>
                    </div>
                </div>
                
                <div class="quote-actions">
                    <button type="button" class="accept-btn" onclick="window.location.href='tel:07833588488'">
                        📞 Speak to Account Manager Now
                    </button>
                    <button type="button" class="schedule-btn">
                        📅 Schedule Callback
                    </button>
                    <button type="button" class="download-btn">
                        📄 Download Proposal PDF
                    </button>
                </div>
                
                <div class="urgency-note">
                    <p>⚡ <strong>Fast-Track Available:</strong> We can start emergency repairs within 24 hours while contracts are finalized.</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Track this as a high-value lead
        this.trackEnterpriseLead(data, total);
    }

    trackEnterpriseLead(data, value) {
        // Send to CRM/Analytics
        console.log('Enterprise Lead:', {
            company: data.company,
            sites: data.sites,
            value: value,
            urgency: data.urgency,
            contact: data.contact
        });
        
        // Store for follow-up
        localStorage.setItem('crs_enterprise_lead', JSON.stringify({
            ...data,
            value,
            timestamp: Date.now()
        }));
        
        // Could trigger automated notifications to sales team
        this.notifySalesTeam(data, value);
    }

    notifySalesTeam(data, value) {
        // In real implementation, this would send alerts
        console.log(`🚨 HIGH VALUE LEAD: ${data.sites} sites, £${value} potential`);
    }

    showProcessingModal(count) {
        const modal = document.createElement('div');
        modal.className = 'processing-modal';
        modal.innerHTML = `
            <div class="processing-content">
                <h3>Analyzing ${count} Locations</h3>
                <div class="progress-bar">
                    <div class="progress-fill" id="progressFill"></div>
                </div>
                <p id="progressText">Processing location 1 of ${count}...</p>
            </div>
        `;
        document.body.appendChild(modal);
    }

    updateProcessingProgress(current, total) {
        const fill = document.getElementById('progressFill');
        const text = document.getElementById('progressText');
        
        if (fill) {
            fill.style.width = `${(current / total) * 100}%`;
        }
        
        if (text) {
            if (current === total) {
                text.textContent = 'Analysis complete! Preparing your quote...';
                setTimeout(() => {
                    document.querySelector('.processing-modal')?.remove();
                    this.showPortfolioDashboard();
                }, 1500);
            } else {
                text.textContent = `Processing location ${current} of ${total}...`;
            }
        }
    }

    showPortfolioDashboard() {
        // Show comprehensive dashboard with all sites
        const totalIssues = this.sites.reduce((sum, site) => sum + site.issues, 0);
        const totalQuote = this.sites.reduce((sum, site) => sum + site.quote, 0);
        const volumeDiscount = totalQuote * 0.25;
        const finalQuote = totalQuote - volumeDiscount;
        
        const dashboard = document.createElement('div');
        dashboard.className = 'portfolio-dashboard';
        dashboard.innerHTML = `
            <div class="dashboard-header">
                <h2>Portfolio Assessment Complete</h2>
                <div class="dashboard-stats">
                    <div class="stat">
                        <span class="stat-number">${this.sites.length}</span>
                        <span class="stat-label">Sites Analyzed</span>
                    </div>
                    <div class="stat">
                        <span class="stat-number">${totalIssues}</span>
                        <span class="stat-label">Total Issues</span>
                    </div>
                    <div class="stat">
                        <span class="stat-number">£${finalQuote.toLocaleString()}</span>
                        <span class="stat-label">Portfolio Quote</span>
                    </div>
                    <div class="stat">
                        <span class="stat-number">£${volumeDiscount.toLocaleString()}</span>
                        <span class="stat-label">Volume Savings</span>
                    </div>
                </div>
            </div>
            
            <div class="sites-grid">
                ${this.sites.map((site, i) => `
                    <div class="site-card">
                        <h4>Location ${i + 1}</h4>
                        <p>${site.issues} issues found</p>
                        <p class="site-quote">£${site.quote.toLocaleString()}</p>
                    </div>
                `).join('')}
            </div>
            
            <div class="dashboard-actions">
                <button class="approve-all-btn">Approve All Sites</button>
                <button class="customize-btn">Customize Package</button>
                <button class="export-btn">Export Report</button>
            </div>
        `;
        
        document.querySelector('.enterprise-portal').appendChild(dashboard);
    }

    injectEnterpriseStyles() {
        const styles = document.createElement('style');
        styles.textContent = `
            .enterprise-banner {
                background: linear-gradient(135deg, #003366, #004080);
                color: white;
                padding: 1rem;
                position: sticky;
                top: 60px;
                z-index: 99;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            
            .enterprise-content {
                max-width: 1200px;
                margin: 0 auto;
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-wrap: wrap;
                gap: 1rem;
            }
            
            .enterprise-message strong {
                display: block;
                font-size: 1.1rem;
                margin-bottom: 0.25rem;
            }
            
            .enterprise-cta {
                background: white;
                color: #003366;
                border: none;
                padding: 0.75rem 1.5rem;
                border-radius: 8px;
                font-weight: bold;
                cursor: pointer;
                transition: transform 0.2s;
            }
            
            .enterprise-cta:hover {
                transform: translateY(-2px);
            }
            
            .enterprise-portal {
                max-width: 1200px;
                margin: 0 auto;
                padding: 2rem;
            }
            
            .portal-header {
                text-align: center;
                margin-bottom: 3rem;
            }
            
            .portal-header h1 {
                color: #003366;
                font-size: 2.5rem;
                margin-bottom: 0.5rem;
            }
            
            .quick-setup h2 {
                color: #003366;
                margin-bottom: 1.5rem;
            }
            
            .setup-options {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 1.5rem;
                margin-bottom: 3rem;
            }
            
            .setup-card {
                background: white;
                border: 2px solid #E5E7EB;
                border-radius: 12px;
                padding: 2rem;
                text-align: center;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .setup-card:hover {
                border-color: #FF6B35;
                transform: translateY(-4px);
                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            }
            
            .setup-icon {
                font-size: 3rem;
                display: block;
                margin-bottom: 1rem;
            }
            
            .setup-card h3 {
                color: #003366;
                margin-bottom: 0.5rem;
            }
            
            .setup-card p {
                color: #6B7280;
                font-size: 0.9rem;
            }
            
            .instant-form {
                background: white;
                border-radius: 12px;
                padding: 2rem;
                box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                margin-bottom: 3rem;
            }
            
            .form-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 1.5rem;
                margin-top: 1.5rem;
            }
            
            .form-group {
                display: flex;
                flex-direction: column;
            }
            
            .form-group.full-width {
                grid-column: 1 / -1;
            }
            
            .form-group label {
                font-weight: 600;
                margin-bottom: 0.5rem;
                color: #003366;
            }
            
            .form-group input,
            .form-group textarea {
                padding: 0.75rem;
                border: 2px solid #E5E7EB;
                border-radius: 8px;
                font-size: 1rem;
            }
            
            .form-group input:focus,
            .form-group textarea:focus {
                outline: none;
                border-color: #FF6B35;
            }
            
            .urgency-options {
                display: flex;
                gap: 1rem;
                flex-wrap: wrap;
            }
            
            .urgency-option {
                display: flex;
                align-items: center;
                padding: 0.75rem 1rem;
                border: 2px solid #E5E7EB;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .urgency-option:hover {
                border-color: #FF6B35;
            }
            
            .urgency-option input {
                margin-right: 0.5rem;
            }
            
            .submit-btn {
                background: #FF6B35;
                color: white;
                border: none;
                padding: 1rem 2rem;
                border-radius: 8px;
                font-size: 1.1rem;
                font-weight: bold;
                cursor: pointer;
                margin-top: 1.5rem;
                width: 100%;
            }
            
            .benefits-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1.5rem;
            }
            
            .benefit {
                text-align: center;
                padding: 1.5rem;
                background: #F9FAFB;
                border-radius: 8px;
            }
            
            .benefit-icon {
                font-size: 2rem;
                display: block;
                margin-bottom: 0.75rem;
            }
            
            .benefit h4 {
                color: #003366;
                margin-bottom: 0.5rem;
            }
            
            .benefit p {
                color: #6B7280;
                font-size: 0.9rem;
            }
            
            /* Quote Modal */
            .quote-modal {
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
                overflow-y: auto;
            }
            
            .quote-content {
                background: white;
                border-radius: 16px;
                max-width: 800px;
                width: 100%;
                max-height: 90vh;
                overflow-y: auto;
                padding: 2rem;
            }
            
            .quote-header {
                text-align: center;
                margin-bottom: 2rem;
            }
            
            .quote-header h2 {
                color: #003366;
                margin-bottom: 0.5rem;
            }
            
            .quote-summary {
                background: #F9FAFB;
                padding: 1.5rem;
                border-radius: 8px;
                margin-bottom: 2rem;
            }
            
            .quote-line {
                display: flex;
                justify-content: space-between;
                padding: 0.75rem 0;
                border-bottom: 1px solid #E5E7EB;
            }
            
            .quote-line.discount {
                color: #10B981;
            }
            
            .quote-line.total {
                border-bottom: none;
                border-top: 2px solid #003366;
                margin-top: 0.5rem;
                padding-top: 1rem;
                font-weight: bold;
                font-size: 1.2rem;
                color: #003366;
            }
            
            .quote-line.monthly {
                border: none;
                color: #FF6B35;
                font-weight: 600;
            }
            
            .quote-includes h3,
            .quote-timeline h3 {
                color: #003366;
                margin-bottom: 1rem;
            }
            
            .quote-includes ul {
                list-style: none;
                padding: 0;
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 0.75rem;
            }
            
            .quote-includes li {
                color: #1A1A1A;
            }
            
            .timeline-item {
                display: flex;
                gap: 1rem;
                margin-bottom: 1.5rem;
            }
            
            .timeline-number {
                width: 40px;
                height: 40px;
                background: #FF6B35;
                color: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                flex-shrink: 0;
            }
            
            .quote-actions {
                display: flex;
                flex-direction: column;
                gap: 1rem;
                margin-top: 2rem;
            }
            
            .quote-actions button {
                padding: 1rem;
                border-radius: 8px;
                font-weight: bold;
                cursor: pointer;
                border: none;
            }
            
            .accept-btn {
                background: #10B981;
                color: white;
                font-size: 1.1rem;
            }
            
            .schedule-btn {
                background: #FF6B35;
                color: white;
            }
            
            .download-btn {
                background: white;
                color: #003366;
                border: 2px solid #003366;
            }
            
            .urgency-note {
                background: #FEF3C7;
                border: 2px solid #F59E0B;
                padding: 1rem;
                border-radius: 8px;
                margin-top: 1.5rem;
                text-align: center;
            }
            
            /* Dashboard Styles */
            .portfolio-dashboard {
                margin-top: 2rem;
            }
            
            .dashboard-header {
                text-align: center;
                margin-bottom: 2rem;
            }
            
            .dashboard-stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 1rem;
                margin-top: 1.5rem;
            }
            
            .stat {
                background: white;
                padding: 1.5rem;
                border-radius: 8px;
                text-align: center;
                box-shadow: 0 2px 10px rgba(0,0,0,0.05);
            }
            
            .stat-number {
                display: block;
                font-size: 2rem;
                font-weight: bold;
                color: #003366;
            }
            
            .stat-label {
                display: block;
                color: #6B7280;
                font-size: 0.9rem;
                margin-top: 0.5rem;
            }
            
            .sites-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                gap: 1rem;
                margin: 2rem 0;
            }
            
            .site-card {
                background: white;
                padding: 1rem;
                border-radius: 8px;
                border: 2px solid #E5E7EB;
                text-align: center;
            }
            
            .site-card h4 {
                color: #003366;
                margin-bottom: 0.5rem;
            }
            
            .site-quote {
                font-weight: bold;
                color: #FF6B35;
                font-size: 1.2rem;
                margin-top: 0.5rem;
            }
            
            .dashboard-actions {
                display: flex;
                gap: 1rem;
                justify-content: center;
                flex-wrap: wrap;
            }
            
            .dashboard-actions button {
                padding: 0.75rem 1.5rem;
                border-radius: 8px;
                font-weight: bold;
                cursor: pointer;
                border: none;
            }
            
            .approve-all-btn {
                background: #10B981;
                color: white;
            }
            
            .customize-btn {
                background: #FF6B35;
                color: white;
            }
            
            .export-btn {
                background: white;
                color: #003366;
                border: 2px solid #003366;
            }
            
            /* Processing Modal */
            .processing-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            }
            
            .processing-content {
                background: white;
                padding: 2rem;
                border-radius: 12px;
                text-align: center;
                min-width: 300px;
            }
            
            .progress-bar {
                width: 100%;
                height: 20px;
                background: #E5E7EB;
                border-radius: 10px;
                overflow: hidden;
                margin: 1rem 0;
            }
            
            .progress-fill {
                height: 100%;
                background: #FF6B35;
                transition: width 0.5s ease;
                width: 0;
            }
            
            @media (max-width: 768px) {
                .form-grid {
                    grid-template-columns: 1fr;
                }
                
                .quote-includes ul {
                    grid-template-columns: 1fr;
                }
                
                .dashboard-stats {
                    grid-template-columns: 1fr 1fr;
                }
            }
        `;
        document.head.appendChild(styles);
    }
}

// Initialize enterprise portal
document.addEventListener('DOMContentLoaded', () => {
    window.enterprisePortal = new EnterprisePortal();
});