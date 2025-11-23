# Setup Guide

## Initial Setup

### 1. Prerequisites Check

Before starting, ensure you have:
- [ ] Node.js 18+ installed (`node --version`)
- [ ] PostgreSQL 12+ installed (`psql --version`)
- [ ] Git installed
- [ ] Code editor (VS Code recommended)

### 2. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd <project-name>

# Install server dependencies
cd server
npm install

# Install client dependencies  
cd ../client
npm install
```

### 3. Database Configuration

#### Create Database
```bash
# Using psql
psql -U postgres
CREATE DATABASE your_database_name;
\q

# Or using createdb
createdb -U postgres your_database_name
```

#### Configure Connection
Edit `server/.env`:
```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=your_database_name
DB_PASSWORD=your_password
DB_PORT=5432
```

#### Run Migrations
```bash
cd server
node scripts/init_db.js
```

You should see:
```
Schema migration completed.
Countries seeded successfully.
```

### 4. Email Service Setup

Choose one option based on your needs:

#### Option A: Mailtrap (Recommended for Development)

1. Go to [mailtrap.io](https://mailtrap.io)
2. Sign up for free account
3. Go to "Inboxes" → "SMTP Settings"
4. Copy credentials to `server/.env`:

```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=<your-username>
SMTP_PASS=<your-password>
EMAIL_FROM="Your App <noreply@yourapp.com>"
FRONTEND_URL=http://localhost:5173
```

#### Option B: Gmail (For Testing with Real Emails)

1. Enable 2-factor authentication on your Google account
2. Go to [Google Account Security](https://myaccount.google.com/security)
3. Search for "App passwords"
4. Generate password for "Mail"
5. Configure `server/.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=<generated-app-password>
EMAIL_FROM="Your App <your-email@gmail.com>"
FRONTEND_URL=http://localhost:5173
```

#### Option C: SendGrid (For Production)

1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Create API key
3. Configure `server/.env`:

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=<your-api-key>
EMAIL_FROM="Your App <noreply@yourdomain.com>"
FRONTEND_URL=https://your-production-url.com
```

### 5. Google OAuth Setup (Optional)

If you want Google Sign-In:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Choose "Web application"
6. Add authorized JavaScript origins:
   - `http://localhost:5173`
   - `http://localhost:3000`
7. Add authorized redirect URIs:
   - `http://localhost:5173`
8. Copy Client ID
9. Add to both `.env` files:

**server/.env**:
```env
GOOGLE_CLIENT_ID=<your-client-id>.apps.googleusercontent.com
```

**client/.env**:
```env
VITE_GOOGLE_CLIENT_ID=<your-client-id>.apps.googleusercontent.com
```

### 6. Start Development Servers

Open two terminal windows:

**Terminal 1 - Backend**:
```bash
cd server
npm run dev
```

You should see:
```
Server running on port 3000
```

**Terminal 2 - Frontend**:
```bash
cd client
npm run dev
```

You should see:
```
VITE v7.x.x ready in XXX ms
Local: http://localhost:5173/
```

### 7. Verify Installation

1. Open browser to `http://localhost:5173`
2. You should see the login page
3. Click "Register now" to create an account
4. Fill the form and submit
5. Login with your credentials
6. Test "Forgot password?" flow

## Troubleshooting

### Database Connection Errors
```
Error: password authentication failed
```
**Solution**: Check `DB_USER` and `DB_PASSWORD` in `server/.env`

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3000
```
**Solution**: 
```bash
# Find and kill process
lsof -ti:3000 | xargs kill -9
```

### Email Not Sending
**Solution**: 
1. Check SMTP credentials in `server/.env`
2. Restart server after changing `.env`
3. Check server console for email preview URL (Mailtrap)

### Google OAuth Not Working
**Solution**:
1. Verify Client ID is correct in both `.env` files
2. Check authorized origins in Google Console
3. Restart both servers after changing `.env`

## Next Steps

- Read [CUSTOMIZATION.md](./CUSTOMIZATION.md) to personalize the app
- Explore the codebase
- Start building your features!
