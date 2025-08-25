// Portal API Integration
class PortalAPI {
    constructor() {
        // Use consolidated main API endpoint to stay under Vercel's function limit
        this.baseURL = '/api/main';
        this.token = localStorage.getItem('authToken');
        this.user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    }
    
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': this.token ? `Bearer ${this.token}` : '',
                ...options.headers
            }
        };
        
        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Request failed');
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
    
    // Authentication
    async login(email, password) {
        // Use direct login endpoint instead of main router
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }
        
        this.token = data.token;
        this.user = data.user;
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        
        return data;
    }
    
    async register(userData) {
        const data = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        
        this.token = data.token;
        this.user = data.user;
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        
        return data;
    }
    
    // Sites Management
    async getSites() {
        return await this.request('/sites');
    }
    
    async createSite(siteData) {
        return await this.request('/sites', {
            method: 'POST',
            body: JSON.stringify(siteData)
        });
    }
    
    async updateSite(siteData) {
        return await this.request('/sites', {
            method: 'PUT',
            body: JSON.stringify(siteData)
        });
    }
    
    async deleteSite(siteId) {
        return await this.request(`/sites?id=${siteId}`, {
            method: 'DELETE'
        });
    }
    
    // Damage Reports
    async getDamageReports() {
        return await this.request('/damage-reports');
    }
    
    async createDamageReport(reportData) {
        return await this.request('/damage-reports', {
            method: 'POST',
            body: JSON.stringify(reportData)
        });
    }
    
    async updateReportStatus(reportId, status) {
        return await this.request('/damage-reports', {
            method: 'PUT',
            body: JSON.stringify({ id: reportId, status })
        });
    }
    
    // Admin Functions
    async getAdminStats() {
        return await this.request('/admin/stats');
    }
    
    async getClients() {
        return await this.request('/admin/clients');
    }
    
    async createClient(clientData) {
        return await this.request('/admin/clients', {
            method: 'POST',
            body: JSON.stringify(clientData)
        });
    }
    
    async updateClient(clientData) {
        return await this.request('/admin/clients', {
            method: 'PUT',
            body: JSON.stringify(clientData)
        });
    }
    
    async deleteClient(clientId) {
        return await this.request(`/admin/clients?id=${clientId}`, {
            method: 'DELETE'
        });
    }
    
    // Onboarding
    async submitOnboarding(data) {
        return await this.request('/onboarding', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
    
    // Settings Management
    async getSettings() {
        return await this.request('/settings');
    }
    
    async updateSettings(settings) {
        return await this.request('/settings', {
            method: 'PUT',
            body: JSON.stringify({ settings })
        });
    }
    
    // Documentation Management
    async getDocs(params = {}) {
        const query = new URLSearchParams(params).toString();
        return await this.request(`/docs${query ? '?' + query : ''}`);
    }
    
    async createDoc(doc) {
        return await this.request('/docs', {
            method: 'POST',
            body: JSON.stringify(doc)
        });
    }
    
    async updateDoc(doc) {
        return await this.request('/docs', {
            method: 'PUT',
            body: JSON.stringify(doc)
        });
    }
    
    async deleteDoc(id) {
        return await this.request(`/docs?id=${id}`, {
            method: 'DELETE'
        });
    }
    
    // Utility
    isLoggedIn() {
        return !!this.token;
    }
    
    isAdmin() {
        return this.user.role === 'admin' || this.user.role === 'super_admin';
    }
    
    isSuperAdmin() {
        return this.user.role === 'super_admin';
    }
    
    logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        this.token = null;
        this.user = {};
        window.location.href = '/portal-api.html';
    }
}

// Export for use in pages
window.PortalAPI = PortalAPI;