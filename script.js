// CRS Landing Page JavaScript - Interactive Features

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', function() {
    initPhotoUpload();
    initSectorSelector();
    initNeglectCalculator();
    initSmoothScroll();
    initLiveTicker();
    initMobileMenu();
});

// Photo Upload and AI Assessment
function initPhotoUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const photoInput = document.getElementById('photoInput');
    const uploadBtn = document.querySelector('.upload-btn');
    const analysisDisplay = document.getElementById('analysisDisplay');
    
    // Click to upload
    uploadBtn.addEventListener('click', () => photoInput.click());
    uploadArea.addEventListener('click', () => photoInput.click());
    
    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handlePhotoUpload(files[0]);
        }
    });
    
    // File input change
    photoInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handlePhotoUpload(e.target.files[0]);
        }
    });
}

// Handle photo upload and simulate AI analysis
async function handlePhotoUpload(file) {
    if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
    }
    
    // VALIDATE FIRST - Check if it's actually a car park
    if (window.validateBeforeUpload) {
        const isValid = await window.validateBeforeUpload(file);
        if (!isValid) {
            return; // Validation failed, error message already shown
        }
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const uploadedImage = document.getElementById('uploadedImage');
        uploadedImage.src = e.target.result;
        
        // Hide upload area and show analysis
        document.getElementById('uploadArea').style.display = 'none';
        document.getElementById('analysisDisplay').style.display = 'block';
        
        // Simulate AI analysis
        simulateAnalysis();
    };
    reader.readAsDataURL(file);
}

// Simulate AI zone analysis with animations
function simulateAnalysis() {
    let problemsFound = 0;
    const uploadedImage = document.getElementById('uploadedImage');
    const damageOverlay = document.querySelector('.damage-overlay');
    
    // Create heat map overlay effect
    damageOverlay.style.position = 'absolute';
    damageOverlay.style.top = '0';
    damageOverlay.style.left = '0';
    damageOverlay.style.right = '0';
    damageOverlay.style.bottom = '0';
    damageOverlay.style.pointerEvents = 'none';
    
    // Animate problem detection (simulate finding multiple issues)
    const findProblems = setInterval(() => {
        problemsFound++;
        
        // Update problem counter with animation
        document.getElementById('problemCount').textContent = `${problemsFound} pothole${problemsFound > 1 ? 's' : ''} detected`;
        document.getElementById('problemCount').classList.add('animated');
        
        // Add visual marker for each problem found
        const marker = document.createElement('div');
        marker.className = 'problem-marker';
        marker.style.cssText = `
            position: absolute;
            left: ${Math.random() * 60 + 20}%;
            top: ${Math.random() * 60 + 20}%;
            width: 40px;
            height: 40px;
            border: 3px solid #EF4444;
            border-radius: 50%;
            background: rgba(239, 68, 68, 0.2);
            animation: pulse 1s infinite;
        `;
        marker.innerHTML = '<span style="color: #EF4444; font-weight: bold; display: block; text-align: center; line-height: 34px;">' + problemsFound + '</span>';
        damageOverlay.appendChild(marker);
        
        if (problemsFound >= 7) {
            clearInterval(findProblems);
            
            // Show zone calculation after finding all problems
            setTimeout(() => {
                calculateZone(problemsFound);
            }, 500);
        }
    }, 400);
    
    // Track conversion event
    trackEvent('photo_uploaded', {
        category: 'engagement',
        label: 'zone_assessment'
    });
}

// Calculate and display zone pricing
function calculateZone(problemCount) {
    // Simulate zone size calculation
    const zoneSize = Math.round(50 + (problemCount * 25)); // Simple formula for demo
    document.getElementById('zoneSize').textContent = `${zoneSize}m²`;
    document.getElementById('zoneSize').classList.add('animated');
    
    // Update includes list
    setTimeout(() => {
        document.getElementById('includesList').textContent = `All ${problemCount} potholes + any cracks/damage in zone`;
        document.getElementById('includesList').style.color = '#10B981';
        document.getElementById('includesList').style.fontWeight = 'bold';
    }, 500);
    
    // Calculate zone price based on size
    let zonePrice;
    if (zoneSize <= 100) {
        zonePrice = 2200;
    } else if (zoneSize <= 250) {
        zonePrice = 3200;
    } else {
        zonePrice = 4800;
    }
    
    // Calculate what others would charge (per pothole)
    const competitorPrice = problemCount * 450;
    
    // Update comparison display
    setTimeout(() => {
        // Update competitor pricing
        const othersList = document.querySelector('.other-contractors ul');
        othersList.innerHTML = `
            <li class="crossed">❌ ${problemCount} separate quotes needed</li>
            <li class="crossed">❌ Total: £${competitorPrice} (£450 each)</li>
            <li class="crossed">❌ Multiple visits to fix all</li>
        `;
        
        // Update CRS price with animation
        const priceElement = document.getElementById('crsPrice');
        animateValue(priceElement, 0, zonePrice, 1000);
        
        // Update the timeline text
        const timeline = priceElement.nextElementSibling;
        timeline.innerHTML = `Fixes ALL ${problemCount} + any others in ${zoneSize}m² zone ✅`;
        
        // Show savings message
        if (competitorPrice > zonePrice) {
            const savings = competitorPrice - zonePrice;
            const savingsDiv = document.createElement('div');
            savingsDiv.className = 'savings-highlight';
            savingsDiv.style.cssText = `
                background: #10B981;
                color: white;
                padding: 0.5rem;
                border-radius: 4px;
                margin-top: 1rem;
                text-align: center;
                font-weight: bold;
                animation: slideIn 0.5s ease-out;
            `;
            savingsDiv.textContent = `You save £${savings} vs per-pothole pricing!`;
            document.querySelector('.crs-price').appendChild(savingsDiv);
        }
        
        // Add zone visualization button
        const vizButton = document.createElement('button');
        vizButton.className = 'zone-viz-btn';
        vizButton.style.cssText = `
            background: #003366;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            margin-top: 0.5rem;
            cursor: pointer;
            font-size: 0.9rem;
        `;
        vizButton.textContent = '📍 See Coverage Zone';
        vizButton.onclick = showZoneOverlay;
        document.querySelector('.your-photo').appendChild(vizButton);
        
        // Add booking button animation
        document.querySelector('.book-now').classList.add('pulse');
        document.querySelector('.book-now').textContent = `Fix All ${problemCount} Problems - One Visit`;
    }, 1000);
}

// Show zone coverage overlay
function showZoneOverlay() {
    const damageOverlay = document.querySelector('.damage-overlay');
    
    // Create zone boundary
    const zoneBoundary = document.createElement('div');
    zoneBoundary.className = 'zone-boundary';
    zoneBoundary.style.cssText = `
        position: absolute;
        left: 10%;
        top: 10%;
        right: 10%;
        bottom: 10%;
        border: 3px dashed #10B981;
        background: rgba(16, 185, 129, 0.1);
        border-radius: 8px;
        animation: zoneExpand 1s ease-out;
    `;
    
    // Add zone label
    const zoneLabel = document.createElement('div');
    zoneLabel.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #10B981;
        color: white;
        padding: 1rem;
        border-radius: 4px;
        font-weight: bold;
        font-size: 1.2rem;
    `;
    zoneLabel.textContent = 'EVERYTHING IN THIS ZONE FIXED';
    zoneBoundary.appendChild(zoneLabel);
    
    damageOverlay.appendChild(zoneBoundary);
    
    // Remove after 3 seconds
    setTimeout(() => {
        zoneBoundary.remove();
    }, 3000);
}

// Add zone animation styles
const zoneStyles = document.createElement('style');
zoneStyles.textContent = `
    @keyframes zoneExpand {
        from {
            transform: scale(0.8);
            opacity: 0;
        }
        to {
            transform: scale(1);
            opacity: 1;
        }
    }
    .problem-marker {
        z-index: 10;
    }
    .zone-boundary {
        z-index: 5;
    }
`;
document.head.appendChild(zoneStyles);

// Animate number counting
function animateValue(element, start, end, duration) {
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= end) {
            current = end;
            clearInterval(timer);
        }
        element.textContent = '£' + Math.round(current);
    }, 16);
}

// Sector Selector
function initSectorSelector() {
    const sectorButtons = document.querySelectorAll('.sector-btn');
    const sectorPanels = document.querySelectorAll('.sector-panel');
    
    sectorButtons.forEach(button => {
        button.addEventListener('click', () => {
            const sector = button.dataset.sector;
            
            // Update active button
            sectorButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Show relevant panel
            if (sector === 'all') {
                sectorPanels.forEach(panel => panel.style.display = 'block');
            } else {
                sectorPanels.forEach(panel => {
                    panel.style.display = panel.dataset.sector === sector ? 'block' : 'none';
                });
            }
            
            // Track sector interest
            trackEvent('sector_selected', {
                category: 'engagement',
                label: sector
            });
        });
    });
}

// Neglect Calculator
function initNeglectCalculator() {
    const problemButtons = document.querySelectorAll('.problem-btn');
    const costNow = document.getElementById('costNow');
    const costLater = document.getElementById('costLater');
    const costClaim = document.getElementById('costClaim');
    
    const costs = {
        small: { now: 350, later: 1200, claim: 3500 },
        medium: { now: 550, later: 2000, claim: 5500 },
        crack: { now: 150, later: 600, claim: 2500 }
    };
    
    problemButtons.forEach(button => {
        button.addEventListener('click', () => {
            const problem = button.dataset.problem;
            
            // Update active button
            problemButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Update costs with animation
            const cost = costs[problem];
            animateValue(costNow, parseInt(costNow.textContent.replace('£', '')), cost.now, 500);
            animateValue(costLater, parseInt(costLater.textContent.replace('£', '')), cost.later, 500);
            
            // Update claim cost
            costClaim.textContent = `£${cost.claim}+`;
            
            // Track calculator use
            trackEvent('calculator_used', {
                category: 'engagement',
                label: problem
            });
        });
    });
}

// Smooth Scroll
function initSmoothScroll() {
    document.querySelectorAll('.scroll-to-upload').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelector('.instant-quote-tool').scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
            
            // Flash the upload area
            const uploadArea = document.getElementById('uploadArea');
            uploadArea.style.borderColor = 'var(--action-orange)';
            setTimeout(() => {
                uploadArea.style.borderColor = '';
            }, 1000);
        });
    });
}

// Live Ticker
function initLiveTicker() {
    // The CSS animation handles the scrolling
    // This could be enhanced with real-time data
    
    // Optional: Add new items dynamically
    const ticker = document.querySelector('.ticker-track');
    
    // Simulate adding a new completed job every 30 seconds
    setInterval(() => {
        const jobs = [
            'Just completed: Tesco car park - £425',
            'Fixed: School entrance pothole - £275',
            'Sorted: NHS clinic crack seal - £180',
            'Done: Retail park repair - £650'
        ];
        
        const randomJob = jobs[Math.floor(Math.random() * jobs.length)];
        const newItem = document.createElement('span');
        newItem.className = 'ticker-item';
        newItem.textContent = '✅ ' + randomJob;
        
        // Clone and append to maintain seamless scroll
        ticker.appendChild(newItem.cloneNode(true));
    }, 30000);
}

// Mobile Menu
function initMobileMenu() {
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const nav = document.querySelector('.desktop-nav');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex';
            nav.style.position = 'absolute';
            nav.style.top = '100%';
            nav.style.left = '0';
            nav.style.right = '0';
            nav.style.backgroundColor = 'white';
            nav.style.flexDirection = 'column';
            nav.style.padding = '1rem';
            nav.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
        });
    }
}

// Book Now Button Handler
document.querySelectorAll('.book-now').forEach(button => {
    button.addEventListener('click', () => {
        showBookingModal();
    });
});

// Simple Booking Modal
function showBookingModal() {
    const modal = document.createElement('div');
    modal.className = 'booking-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Book Your Repair</h2>
            <p>Quick details to get you sorted:</p>
            <form id="quickBookingForm">
                <input type="text" placeholder="Your Name" required>
                <input type="tel" placeholder="Phone Number" required>
                <input type="email" placeholder="Email" required>
                <input type="text" placeholder="Location/Postcode" required>
                <select required>
                    <option value="">Preferred Time</option>
                    <option>This Week - Daytime</option>
                    <option>This Week - Evening</option>
                    <option>This Week - Weekend</option>
                    <option>Next Week - Flexible</option>
                    <option>Emergency - ASAP</option>
                </select>
                <button type="submit" class="cta-button primary">Confirm Booking</button>
                <button type="button" class="close-modal">Cancel</button>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .booking-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            animation: fadeIn 0.3s;
        }
        .modal-content {
            background: white;
            padding: 2rem;
            border-radius: 8px;
            max-width: 400px;
            width: 90%;
        }
        .modal-content h2 {
            color: var(--primary-blue);
            margin-bottom: 1rem;
        }
        .modal-content input,
        .modal-content select {
            width: 100%;
            padding: 0.75rem;
            margin-bottom: 1rem;
            border: 2px solid var(--border-gray);
            border-radius: 4px;
        }
        .close-modal {
            background: none;
            border: none;
            color: var(--text-light);
            cursor: pointer;
            margin-top: 1rem;
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    // Handle form submission
    document.getElementById('quickBookingForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Track conversion
        trackEvent('booking_submitted', {
            category: 'conversion',
            label: 'quick_booking'
        });
        
        // Show success message
        modal.querySelector('.modal-content').innerHTML = `
            <h2>✅ Booking Confirmed!</h2>
            <p>We'll call you within 2 hours to confirm the details.</p>
            <p><strong>Your repair reference: CRS-${Date.now().toString().slice(-6)}</strong></p>
            <button class="cta-button primary" onclick="this.closest('.booking-modal').remove()">Close</button>
        `;
    });
    
    // Close modal
    modal.querySelector('.close-modal')?.addEventListener('click', () => {
        modal.remove();
    });
}

// Analytics Tracking
function trackEvent(action, data = {}) {
    // Google Analytics 4
    if (typeof gtag !== 'undefined') {
        gtag('event', action, data);
    }
    
    // Facebook Pixel
    if (typeof fbq !== 'undefined') {
        fbq('track', action, data);
    }
    
    // Console log for development
    console.log('Event tracked:', action, data);
}

// Performance Monitoring
window.addEventListener('load', () => {
    const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
    
    if (loadTime > 2000) {
        console.warn('Page load time:', loadTime + 'ms - Consider optimization');
    } else {
        console.log('Page load time:', loadTime + 'ms - Excellent!');
    }
    
    // Track page load performance
    trackEvent('page_load_time', {
        category: 'performance',
        value: loadTime
    });
});

// Add pulse animation class
const style = document.createElement('style');
style.textContent = `
    .pulse {
        animation: pulse 2s infinite;
    }
    @keyframes pulse {
        0% {
            box-shadow: 0 0 0 0 rgba(255, 107, 53, 0.7);
        }
        70% {
            box-shadow: 0 0 0 10px rgba(255, 107, 53, 0);
        }
        100% {
            box-shadow: 0 0 0 0 rgba(255, 107, 53, 0);
        }
    }
    .animated {
        animation: slideIn 0.5s ease-out;
    }
`;
document.head.appendChild(style);

// Exit Intent Detection
let exitIntentShown = false;
document.addEventListener('mouseout', (e) => {
    if (!exitIntentShown && e.clientY <= 0) {
        exitIntentShown = true;
        
        // Show exit intent message
        const exitModal = document.createElement('div');
        exitModal.className = 'exit-modal';
        exitModal.innerHTML = `
            <div class="exit-content">
                <h2>Wait! Your small problem is getting bigger...</h2>
                <p>Every day you wait adds £45 to your liability risk</p>
                <button class="cta-button primary" onclick="this.closest('.exit-modal').remove()">
                    Get Quick Quote Now
                </button>
                <button class="close-exit" onclick="this.closest('.exit-modal').remove()">×</button>
            </div>
        `;
        
        // Add exit modal styles
        const exitStyle = document.createElement('style');
        exitStyle.textContent = `
            .exit-modal {
                position: fixed;
                top: 20%;
                left: 50%;
                transform: translateX(-50%);
                background: white;
                padding: 2rem;
                border-radius: 8px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                z-index: 2000;
                animation: slideDown 0.5s ease-out;
            }
            .close-exit {
                position: absolute;
                top: 10px;
                right: 10px;
                background: none;
                border: none;
                font-size: 2rem;
                cursor: pointer;
            }
            @keyframes slideDown {
                from { top: -100px; opacity: 0; }
                to { top: 20%; opacity: 1; }
            }
        `;
        document.head.appendChild(exitStyle);
        document.body.appendChild(exitModal);
        
        // Track exit intent
        trackEvent('exit_intent_shown', {
            category: 'engagement',
            label: 'exit_prevention'
        });
    }
});