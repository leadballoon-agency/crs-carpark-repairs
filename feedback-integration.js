// Feedback Widget Integration
// Add this to any page to enable the feedback widget

(function() {
    // Inject styles
    const styles = `
        .feedback-fab {
            position: fixed;
            bottom: 30px;
            right: 30px;
            width: 56px;
            height: 56px;
            background: #FFD700;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 998;
            transition: all 0.3s;
        }
        
        .feedback-fab:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 20px rgba(0,0,0,0.2);
        }
        
        .feedback-fab.pulse {
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4); }
            50% { box-shadow: 0 4px 20px rgba(255, 215, 0, 0.8); }
        }
        
        .feedback-popup {
            display: none;
            position: fixed;
            bottom: 100px;
            right: 30px;
            width: 320px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            z-index: 999;
        }
        
        .feedback-popup.active {
            display: block;
            animation: slideUp 0.3s ease;
        }
        
        @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .feedback-popup-header {
            background: #FFD700;
            padding: 15px;
            border-radius: 12px 12px 0 0;
            position: relative;
        }
        
        .feedback-popup-title {
            font-weight: 600;
            margin: 0;
        }
        
        .feedback-popup-close {
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(0,0,0,0.1);
            border: none;
            width: 25px;
            height: 25px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 16px;
        }
        
        .feedback-popup-body {
            padding: 15px;
        }
        
        .feedback-quick-options {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
            margin-bottom: 12px;
        }
        
        .feedback-quick-btn {
            padding: 8px;
            background: #f5f5f5;
            border: 2px solid transparent;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s;
        }
        
        .feedback-quick-btn:hover,
        .feedback-quick-btn.selected {
            border-color: #FFD700;
            background: #FFF9E6;
        }
        
        .feedback-text {
            width: 100%;
            padding: 10px;
            border: 2px solid #e0e0e0;
            border-radius: 6px;
            resize: vertical;
            min-height: 80px;
            font-size: 13px;
            font-family: inherit;
        }
        
        .feedback-text:focus {
            outline: none;
            border-color: #FFD700;
        }
        
        .feedback-submit-btn {
            width: 100%;
            padding: 10px;
            background: #FFD700;
            border: none;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            margin-top: 10px;
        }
        
        .feedback-submit-btn:hover {
            background: #FFC700;
        }
        
        @media (max-width: 480px) {
            .feedback-popup {
                right: 10px;
                left: 10px;
                width: auto;
            }
        }
    `;
    
    // Inject CSS
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
    
    // Create feedback button
    const feedbackButton = document.createElement('div');
    feedbackButton.className = 'feedback-fab';
    feedbackButton.innerHTML = '💡';
    feedbackButton.onclick = toggleFeedback;
    
    // Create feedback popup
    const feedbackPopup = document.createElement('div');
    feedbackPopup.className = 'feedback-popup';
    feedbackPopup.innerHTML = `
        <div class="feedback-popup-header">
            <h4 class="feedback-popup-title">Quick Feedback</h4>
            <button class="feedback-popup-close" onclick="closeFeedback()">×</button>
        </div>
        <div class="feedback-popup-body">
            <div class="feedback-quick-options">
                <button class="feedback-quick-btn" data-type="bug">🐛 Bug</button>
                <button class="feedback-quick-btn" data-type="idea">💡 Idea</button>
                <button class="feedback-quick-btn" data-type="improve">🔧 Improve</button>
                <button class="feedback-quick-btn" data-type="love">❤️ Love it</button>
            </div>
            <textarea class="feedback-text" placeholder="What's on your mind?"></textarea>
            <button class="feedback-submit-btn" onclick="submitQuickFeedback()">Send Feedback</button>
        </div>
    `;
    
    // Add to page
    document.body.appendChild(feedbackButton);
    document.body.appendChild(feedbackPopup);
    
    // Check if first time
    if (!localStorage.getItem('feedbackSeen')) {
        feedbackButton.classList.add('pulse');
        setTimeout(() => {
            feedbackButton.classList.remove('pulse');
            localStorage.setItem('feedbackSeen', 'true');
        }, 5000);
    }
    
    // Functions
    window.toggleFeedback = function() {
        feedbackPopup.classList.toggle('active');
    };
    
    window.closeFeedback = function() {
        feedbackPopup.classList.remove('active');
    };
    
    window.submitQuickFeedback = function() {
        const text = feedbackPopup.querySelector('.feedback-text').value;
        const selectedType = feedbackPopup.querySelector('.feedback-quick-btn.selected');
        
        if (!text) {
            alert('Please enter some feedback');
            return;
        }
        
        const feedback = {
            type: selectedType ? selectedType.dataset.type : 'general',
            text: text,
            page: window.location.pathname,
            user: getCurrentUser(),
            timestamp: new Date().toISOString()
        };
        
        // Send to backend
        fetch('/api/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(feedback)
        }).then(() => {
            // Show success
            feedbackPopup.querySelector('.feedback-popup-body').innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <div style="font-size: 48px; margin-bottom: 10px;">✅</div>
                    <div style="font-weight: 600;">Thank you!</div>
                    <div style="font-size: 12px; color: #666;">Your feedback helps us improve</div>
                </div>
            `;
            
            setTimeout(() => {
                closeFeedback();
                // Reset form
                feedbackPopup.querySelector('.feedback-text').value = '';
                feedbackPopup.querySelectorAll('.feedback-quick-btn').forEach(btn => {
                    btn.classList.remove('selected');
                });
            }, 2000);
        }).catch(() => {
            // Fallback: Store locally
            const localFeedback = JSON.parse(localStorage.getItem('pendingFeedback') || '[]');
            localFeedback.push(feedback);
            localStorage.setItem('pendingFeedback', JSON.stringify(localFeedback));
            alert('Feedback saved! Will sync when online.');
        });
    };
    
    // Quick button selection
    feedbackPopup.querySelectorAll('.feedback-quick-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            feedbackPopup.querySelectorAll('.feedback-quick-btn').forEach(b => {
                b.classList.remove('selected');
            });
            this.classList.add('selected');
        });
    });
    
    // Get current user
    function getCurrentUser() {
        const user = localStorage.getItem('currentUser');
        if (user) {
            const parsed = JSON.parse(user);
            return parsed.name || parsed.email;
        }
        return 'Anonymous';
    }
    
    // Sync pending feedback on load
    window.addEventListener('load', () => {
        const pending = localStorage.getItem('pendingFeedback');
        if (pending) {
            const feedbackItems = JSON.parse(pending);
            feedbackItems.forEach(item => {
                fetch('/api/feedback', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(item)
                }).then(() => {
                    localStorage.removeItem('pendingFeedback');
                });
            });
        }
    });
})();

// Admin Dashboard Integration
function loadFeedbackForAdmin() {
    fetch('/api/feedback/all')
        .then(res => res.json())
        .then(data => {
            displayFeedbackDashboard(data);
        });
}

function displayFeedbackDashboard(feedbackData) {
    // Group by type
    const grouped = feedbackData.reduce((acc, item) => {
        acc[item.type] = (acc[item.type] || []).concat(item);
        return acc;
    }, {});
    
    // Create dashboard HTML
    const dashboardHTML = `
        <div class="feedback-dashboard">
            <h3>User Feedback & Suggestions</h3>
            
            <div class="feedback-stats">
                <div class="stat">
                    <div class="stat-value">${feedbackData.filter(f => f.type === 'bug').length}</div>
                    <div class="stat-label">Bugs</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${feedbackData.filter(f => f.type === 'idea').length}</div>
                    <div class="stat-label">Ideas</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${feedbackData.filter(f => f.priority === 'high').length}</div>
                    <div class="stat-label">High Priority</div>
                </div>
            </div>
            
            <div class="feedback-list">
                ${Object.entries(grouped).map(([type, items]) => `
                    <div class="feedback-group">
                        <h4>${type.charAt(0).toUpperCase() + type.slice(1)}</h4>
                        ${items.map(item => `
                            <div class="feedback-item" data-priority="${item.priority}">
                                <div class="feedback-meta">
                                    <span class="feedback-user">${item.user}</span>
                                    <span class="feedback-time">${new Date(item.timestamp).toLocaleDateString()}</span>
                                </div>
                                <div class="feedback-content">${item.text}</div>
                                <div class="feedback-actions">
                                    <button onclick="markAsResolved('${item.id}')">✓ Resolve</button>
                                    <button onclick="convertToTask('${item.id}')">📋 Create Task</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    document.getElementById('feedbackContainer').innerHTML = dashboardHTML;
}