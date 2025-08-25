// Feedback Widget
class FeedbackWidget {
    constructor() {
        this.api = new PortalAPI();
        this.isOpen = false;
        this.init();
    }
    
    init() {
        this.createWidget();
        this.attachEvents();
    }
    
    createWidget() {
        // Create widget HTML
        const widget = document.createElement('div');
        widget.id = 'feedback-widget';
        widget.innerHTML = `
            <button id="feedback-trigger">
                💬 Feedback
            </button>
            
            <div id="feedback-panel" class="hidden">
                <div class="feedback-header">
                    <h3>Send Feedback</h3>
                    <button class="close-btn">×</button>
                </div>
                
                <div class="feedback-body">
                    <div class="feedback-types">
                        <label class="type-option">
                            <input type="radio" name="feedbackType" value="bug" checked>
                            <span>🐛 Bug Report</span>
                        </label>
                        <label class="type-option">
                            <input type="radio" name="feedbackType" value="feature">
                            <span>✨ Feature Request</span>
                        </label>
                        <label class="type-option">
                            <input type="radio" name="feedbackType" value="improvement">
                            <span>💡 Improvement</span>
                        </label>
                    </div>
                    
                    <div class="priority-selector">
                        <label>Priority:</label>
                        <select id="feedbackPriority">
                            <option value="low">Low</option>
                            <option value="medium" selected>Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                        </select>
                    </div>
                    
                    <textarea id="feedbackText" placeholder="Describe your feedback..." rows="4"></textarea>
                    
                    <button id="submitFeedback" class="submit-btn">Send Feedback</button>
                    
                    <div id="feedbackMessage" class="feedback-message hidden"></div>
                </div>
                
                ${this.api.isAdmin() ? `
                <div class="feedback-admin">
                    <button id="viewAllFeedback">View All Feedback</button>
                </div>
                ` : ''}
            </div>
            
            <div id="feedback-list" class="hidden">
                <div class="feedback-header">
                    <h3>All Feedback</h3>
                    <button class="close-list-btn">×</button>
                </div>
                <div class="feedback-items"></div>
            </div>
        `;
        
        // Add styles
        const styles = document.createElement('style');
        styles.innerHTML = `
            #feedback-widget {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 10000;
            }
            
            #feedback-trigger {
                background: #FFD700;
                color: #000;
                border: none;
                padding: 12px 20px;
                border-radius: 50px;
                font-weight: 600;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                transition: all 0.3s;
            }
            
            #feedback-trigger:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 16px rgba(0,0,0,0.2);
            }
            
            #feedback-panel, #feedback-list {
                position: absolute;
                bottom: 60px;
                right: 0;
                width: 350px;
                max-height: 500px;
                background: white;
                border-radius: 12px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                overflow: hidden;
                transition: all 0.3s;
            }
            
            #feedback-panel.hidden, #feedback-list.hidden {
                opacity: 0;
                transform: translateY(20px);
                pointer-events: none;
            }
            
            .feedback-header {
                background: linear-gradient(135deg, #FFD700, #FFC700);
                color: #000;
                padding: 15px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .feedback-header h3 {
                margin: 0;
                font-size: 18px;
            }
            
            .close-btn, .close-list-btn {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #000;
            }
            
            .feedback-body {
                padding: 20px;
            }
            
            .feedback-types {
                display: flex;
                gap: 10px;
                margin-bottom: 15px;
            }
            
            .type-option {
                flex: 1;
                display: flex;
                align-items: center;
                gap: 5px;
                padding: 8px;
                border: 2px solid #e0e0e0;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .type-option:has(input:checked) {
                border-color: #FFD700;
                background: rgba(255, 215, 0, 0.1);
            }
            
            .type-option input {
                display: none;
            }
            
            .type-option span {
                font-size: 14px;
                font-weight: 500;
            }
            
            .priority-selector {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 15px;
            }
            
            .priority-selector label {
                font-weight: 600;
                font-size: 14px;
            }
            
            .priority-selector select {
                flex: 1;
                padding: 8px;
                border: 2px solid #e0e0e0;
                border-radius: 8px;
                font-size: 14px;
            }
            
            #feedbackText {
                width: 100%;
                padding: 10px;
                border: 2px solid #e0e0e0;
                border-radius: 8px;
                resize: vertical;
                font-family: inherit;
                font-size: 14px;
                margin-bottom: 15px;
            }
            
            #feedbackText:focus {
                outline: none;
                border-color: #FFD700;
            }
            
            .submit-btn {
                width: 100%;
                background: #FFD700;
                color: #000;
                border: none;
                padding: 12px;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .submit-btn:hover {
                background: #FFC700;
            }
            
            .feedback-message {
                margin-top: 10px;
                padding: 10px;
                border-radius: 8px;
                text-align: center;
                font-size: 14px;
            }
            
            .feedback-message.success {
                background: #E8F5E9;
                color: #2E7D32;
            }
            
            .feedback-message.error {
                background: #FFEBEE;
                color: #C62828;
            }
            
            .feedback-admin {
                border-top: 1px solid #e0e0e0;
                padding: 15px 20px;
            }
            
            #viewAllFeedback {
                width: 100%;
                background: #333;
                color: white;
                border: none;
                padding: 10px;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
            }
            
            .feedback-items {
                max-height: 400px;
                overflow-y: auto;
                padding: 15px;
            }
            
            .feedback-item {
                background: #f9f9f9;
                padding: 12px;
                border-radius: 8px;
                margin-bottom: 10px;
            }
            
            .feedback-item-header {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
            }
            
            .feedback-item-type {
                font-weight: 600;
                font-size: 14px;
            }
            
            .feedback-item-priority {
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 600;
            }
            
            .priority-low { background: #E0E0E0; }
            .priority-medium { background: #FFE082; }
            .priority-high { background: #FFAB91; }
            .priority-urgent { background: #EF9A9A; }
            
            .feedback-item-text {
                font-size: 14px;
                color: #666;
                margin-bottom: 8px;
            }
            
            .feedback-item-meta {
                font-size: 12px;
                color: #999;
            }
            
            @media (max-width: 768px) {
                #feedback-panel, #feedback-list {
                    width: 90vw;
                    right: 5vw;
                    left: 5vw;
                }
            }
        `;
        
        document.head.appendChild(styles);
        document.body.appendChild(widget);
    }
    
    attachEvents() {
        // Toggle panel
        document.getElementById('feedback-trigger').addEventListener('click', () => {
            this.togglePanel();
        });
        
        // Close panel
        document.querySelector('.close-btn').addEventListener('click', () => {
            this.closePanel();
        });
        
        // Submit feedback
        document.getElementById('submitFeedback').addEventListener('click', () => {
            this.submitFeedback();
        });
        
        // Admin: View all feedback
        const viewAllBtn = document.getElementById('viewAllFeedback');
        if (viewAllBtn) {
            viewAllBtn.addEventListener('click', () => {
                this.showAllFeedback();
            });
        }
        
        // Close feedback list
        const closeListBtn = document.querySelector('.close-list-btn');
        if (closeListBtn) {
            closeListBtn.addEventListener('click', () => {
                document.getElementById('feedback-list').classList.add('hidden');
            });
        }
    }
    
    togglePanel() {
        const panel = document.getElementById('feedback-panel');
        const list = document.getElementById('feedback-list');
        
        if (panel.classList.contains('hidden')) {
            panel.classList.remove('hidden');
            list.classList.add('hidden');
        } else {
            panel.classList.add('hidden');
        }
    }
    
    closePanel() {
        document.getElementById('feedback-panel').classList.add('hidden');
    }
    
    async submitFeedback() {
        const type = document.querySelector('input[name="feedbackType"]:checked').value;
        const priority = document.getElementById('feedbackPriority').value;
        const text = document.getElementById('feedbackText').value.trim();
        const page = window.location.pathname;
        
        if (!text) {
            this.showMessage('Please enter your feedback', 'error');
            return;
        }
        
        try {
            await this.api.request('/feedback', {
                method: 'POST',
                body: JSON.stringify({ type, priority, text, page })
            });
            
            this.showMessage('Thank you for your feedback!', 'success');
            document.getElementById('feedbackText').value = '';
            
            setTimeout(() => {
                this.closePanel();
            }, 2000);
        } catch (error) {
            this.showMessage('Error submitting feedback. Please try again.', 'error');
        }
    }
    
    async showAllFeedback() {
        try {
            const data = await this.api.request('/feedback');
            const feedbackItems = document.querySelector('.feedback-items');
            
            if (data.feedback && data.feedback.length > 0) {
                feedbackItems.innerHTML = data.feedback.map(item => `
                    <div class="feedback-item">
                        <div class="feedback-item-header">
                            <span class="feedback-item-type">${this.getTypeIcon(item.type)} ${item.type}</span>
                            <span class="feedback-item-priority priority-${item.priority}">${item.priority.toUpperCase()}</span>
                        </div>
                        <div class="feedback-item-text">${item.text}</div>
                        <div class="feedback-item-meta">
                            ${item.user_name || 'Anonymous'} • ${item.page} • ${new Date(item.created_at).toLocaleDateString()}
                            ${item.votes > 0 ? ` • 👍 ${item.votes}` : ''}
                        </div>
                    </div>
                `).join('');
            } else {
                feedbackItems.innerHTML = '<p style="text-align: center; color: #999;">No feedback yet</p>';
            }
            
            document.getElementById('feedback-panel').classList.add('hidden');
            document.getElementById('feedback-list').classList.remove('hidden');
        } catch (error) {
            console.error('Error loading feedback:', error);
            this.showMessage('Error loading feedback', 'error');
        }
    }
    
    getTypeIcon(type) {
        const icons = {
            'bug': '🐛',
            'feature': '✨',
            'improvement': '💡',
            'general': '💬'
        };
        return icons[type] || '💬';
    }
    
    showMessage(message, type) {
        const messageEl = document.getElementById('feedbackMessage');
        messageEl.textContent = message;
        messageEl.className = `feedback-message ${type}`;
        messageEl.classList.remove('hidden');
        
        setTimeout(() => {
            messageEl.classList.add('hidden');
        }, 3000);
    }
}

// Initialize widget when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.feedbackWidget = new FeedbackWidget();
    });
} else {
    window.feedbackWidget = new FeedbackWidget();
}