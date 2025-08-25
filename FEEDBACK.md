# CRS Car Park Repairs - Feature Roadmap & Feedback

## 🚀 Future Features

### Authentication Enhancements

#### Google Sign-In Integration
**Priority:** Medium | **Effort:** 2-3 hours | **Impact:** High

**Implementation Plan:**
1. **Google Cloud Setup Required:**
   - Create project in Google Cloud Console
   - Enable Google Sign-In API
   - Create OAuth 2.0 credentials
   - Add https://crs-carpark-repairs.vercel.app to authorized domains
   - Obtain Client ID

2. **Technical Implementation:**
   ```javascript
   // Add to portal-api.html
   - Google Sign-In JavaScript library
   - "Sign in with Google" button
   - Handle OAuth callback
   
   // New API endpoint: /api/google-login
   - Verify Google token
   - Create/retrieve user account
   - Assign default role (client)
   - Return session token
   ```

3. **Benefits:**
   - One-click authentication
   - No password management
   - Enhanced security (Google handles auth)
   - Auto-populate user profile (name, email, photo)
   - Improved mobile experience
   - Reduced support tickets for password resets

4. **User Flow:**
   - User clicks "Sign in with Google"
   - Google authentication popup
   - Auto-create account if new user
   - Direct to appropriate dashboard (client/admin)

5. **Considerations:**
   - Store Google ID for user matching
   - Handle email changes
   - Role management (default: client, manually promote to admin)
   - Fallback to email/password option

---

## 📝 Current System Notes

### Active Features
- ✅ Priority Tiers: Essential (£199), Professional (£499), Enterprise (Custom)
- ✅ WhatsApp Integration: +44 7833 588488
- ✅ Admin Accounts: Paul & Kelsey (@carparkrepair.co.uk)
- ✅ Report Workflow: Pending → Surveying → Quoted → Approved → In Progress → Completed
- ✅ Mobile-optimized with click-to-call/email

### Known Issues
- ⚠️ Database connection relies on fallback for authentication
- ⚠️ Vercel function body parsing required simplification

---

## 💡 Additional Feature Ideas

1. **Two-Factor Authentication (2FA)**
   - SMS or authenticator app support
   - Enhanced security for admin accounts

2. **Microsoft/Office 365 Sign-In**
   - Similar to Google implementation
   - Better for B2B/enterprise clients

3. **Magic Link Authentication**
   - Passwordless email links
   - Simpler than passwords, no OAuth setup needed

4. **Session Management**
   - "Remember me" option
   - Multi-device session tracking
   - Session timeout controls

5. **Audit Trail**
   - Track all admin actions
   - Login history
   - Report modification logs

---

## 📊 Analytics & Tracking Ideas

- User engagement metrics
- Report submission patterns
- Priority tier conversion tracking
- Response time analytics
- Customer satisfaction scores

---

*Last Updated: August 25, 2025*
*Next Review: September 2025*