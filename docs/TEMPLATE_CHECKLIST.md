# Template Checklist

Use this checklist when setting up a new project from this template.

## Initial Setup

### 1. Clone & Rename
- [ ] Clone the repository
- [ ] Rename project folder
- [ ] Update `package.json` name in both client and server
- [ ] Initialize new git repository (if needed)

### 2. Environment Configuration
- [ ] Copy `server/.env.example` to `server/.env`
- [ ] Copy `client/.env.example` to `client/.env`
- [ ] Update database credentials
- [ ] Configure email service (Mailtrap/Gmail/SendGrid)
- [ ] Add Google Client ID (if using OAuth)

### 3. Database Setup
- [ ] Create PostgreSQL database
- [ ] Update database name in `server/.env`
- [ ] Run `node scripts/init_db.js`
- [ ] Verify tables created successfully
- [ ] Verify countries seeded

### 4. Dependencies
- [ ] Run `npm install` in server directory
- [ ] Run `npm install` in client directory
- [ ] Verify no errors in installation

### 5. Test Run
- [ ] Start backend server (`npm run dev`)
- [ ] Start frontend client (`npm run dev`)
- [ ] Access http://localhost:5173
- [ ] Verify login page loads

## Customization

### 6. Branding
- [ ] Update app name in `client/src/i18n.js`
- [ ] Update email sender name in `server/.env`
- [ ] Update HTML title in `client/index.html`
- [ ] Replace background images (optional)
- [ ] Update favicon (optional)

### 7. Styling (Optional)
- [ ] Customize colors in CSS files
- [ ] Update logo/branding assets
- [ ] Modify layout if needed

### 8. Features
- [ ] Test user registration
- [ ] Test user login
- [ ] Test password recovery
- [ ] Test Google OAuth (if configured)
- [ ] Test language switching

## Production Preparation

### 9. Security
- [ ] Change all default passwords
- [ ] Generate strong JWT secret (if implementing)
- [ ] Review CORS settings
- [ ] Add rate limiting (recommended)
- [ ] Enable HTTPS

### 10. Deployment
- [ ] Set up production database
- [ ] Configure production email service
- [ ] Update `FRONTEND_URL` to production URL
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Test production deployment

### 11. Monitoring (Recommended)
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Configure logging
- [ ] Set up uptime monitoring
- [ ] Configure backups

## Optional Enhancements

### 12. Additional Features
- [ ] Add email verification
- [ ] Implement 2FA
- [ ] Add user profile editing
- [ ] Add avatar upload
- [ ] Implement session timeout
- [ ] Add admin panel

### 13. Testing
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Set up CI/CD pipeline

### 14. Documentation
- [ ] Update README with project-specific info
- [ ] Document custom features
- [ ] Create API documentation
- [ ] Add deployment guide

---

## Quick Reference

### Common Commands

**Development**:
```bash
# Start backend
cd server && npm run dev

# Start frontend
cd client && npm run dev

# Reset database
cd server && node scripts/init_db.js
```

**Database**:
```bash
# Create database
createdb your_db_name

# Connect to database
psql -d your_db_name

# Drop database (careful!)
dropdb your_db_name
```

**Git**:
```bash
# Initialize new repo
git init
git add .
git commit -m "Initial commit from template"

# Connect to GitHub
git remote add origin <your-repo-url>
git push -u origin main
```

---

**Need help?** Check [SETUP.md](./SETUP.md) or [CUSTOMIZATION.md](./CUSTOMIZATION.md)
