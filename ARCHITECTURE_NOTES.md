# CRS Car Park Repairs - Architecture Notes

## Current Architecture (August 2025)

### Technology Stack
- **Frontend**: Static HTML/CSS/JavaScript
- **Backend**: Vercel Serverless Functions (Node.js)
- **Database**: Neon PostgreSQL (Serverless)
- **Hosting**: Vercel
- **Authentication**: Token-based (custom implementation)

### Why Static HTML?
We deliberately chose static HTML over a framework like Next.js/React for the following reasons:

1. **Performance**
   - Lightning fast load times (crucial for conversion rates)
   - No JavaScript framework overhead
   - Better Core Web Vitals scores

2. **SEO Benefits**
   - Search engines can easily crawl static HTML
   - No client-side rendering delays
   - Better rankings for local searches

3. **Simplicity**
   - Easy to maintain and update
   - No build process required
   - Lower learning curve for future developers

4. **Cost Efficiency**
   - Minimal hosting costs
   - No server-side rendering resources needed
   - Efficient CDN caching

### Current File Structure
```
/
├── index.html                 # Main landing page
├── portal-api.html           # Client portal
├── admin-dashboard.html      # Admin dashboard
├── admin-settings.html       # Dynamic content management
├── super-admin.html          # Super admin panel
├── priority-plans.html       # Subscription plans
├── damage-mapper.html        # Interactive damage tool
├── api/                      # Vercel serverless functions
│   ├── auth/                # Authentication endpoints
│   ├── sites/               # Site management
│   ├── damage-reports/      # Damage tracking
│   ├── settings/            # Dynamic settings
│   └── feedback/            # Feedback system
├── js/                      # JavaScript modules
│   ├── portal-api.js        # API client
│   └── feedback-widget.js   # Feedback widget
└── images/                  # Static assets

```

### Dynamic Content System
- All pricing, headlines, and features are editable via admin panel
- Settings stored in Neon database with localStorage fallback
- Changes reflect instantly without code deployment

### Future Migration Path (If Needed)

If we need to migrate to Next.js/React in the future, consider when:
- User interactions become more complex (real-time features)
- Need for server-side rendering for dynamic pages
- Requirement for more sophisticated state management
- Team grows and needs better code organization

**Migration would involve:**
1. Converting HTML to React components (.tsx files)
2. Setting up Next.js routing
3. Moving API endpoints to Next.js API routes
4. Implementing proper TypeScript types
5. Adding build/deployment pipeline

**Estimated effort:** 2-3 weeks for full migration

### Why This Works Well Now
- Perfect for marketing site + admin portal use case
- Fast, SEO-friendly, and cost-effective
- Easy to update content without touching code
- Serverless functions provide all needed backend functionality

### Contact
**Technical Lead:** Mark Taylor (mark@leadballoon.co.uk)
**Last Updated:** August 2025

---

*Note: This architecture has proven effective for the current scale and requirements. The modular structure allows for gradual migration if needed in the future.*