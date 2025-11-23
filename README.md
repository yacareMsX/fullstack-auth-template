# Full-Stack Authentication Module v1.0

A complete, production-ready authentication system with modern UI/UX, built with React, Node.js, Express, and PostgreSQL.

## ✨ Features

### 🔐 Authentication
- **Email/Password Registration** with validation
- **Email/Password Login** with remember me
- **Google OAuth 2.0** integration
- **Password Recovery** via email with secure tokens
- **Session Management** ready

### 🌍 Internationalization
- **Multi-language support** (English/Spanish)
- Easy to add more languages
- Persistent language selection

### 🎨 Modern UI/UX
- **Responsive design** (mobile, tablet, desktop)
- **Beautiful login page** with full-screen background
- **Modal-based login** with side image
- **Full-page registration** form
- **Language switcher** with flag icons
- **Smooth animations** and transitions

### 🔒 Security
- **Password hashing** with bcrypt
- **SQL injection protection** with parameterized queries
- **Secure password reset** tokens (SHA-256, 1-hour expiration, single-use)
- **Email enumeration prevention**
- **CORS** configured

## 📋 Prerequisites

- **Node.js** 18+ 
- **PostgreSQL** 12+
- **npm** or **yarn**
- **Google Cloud Console** account (optional, for Google OAuth)
- **Email service** (Gmail, SendGrid, or Mailtrap)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd <your-repo-name>
```

### 2. Install Dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 3. Database Setup

```bash
# Create PostgreSQL database
createdb your_database_name

# Run migrations
cd server
node scripts/init_db.js
```

### 4. Environment Configuration

```bash
# Server
cd server
cp .env.example .env
# Edit .env with your configuration

# Client
cd ../client
cp .env.example .env
# Edit .env with your Google Client ID
```

### 5. Start Development Servers

```bash
# Terminal 1 - Start backend
cd server
npm run dev

# Terminal 2 - Start frontend
cd client
npm run dev
```

Visit **http://localhost:5173** to see the app!

## 📁 Project Structure

```
├── server/
│   ├── routes/
│   │   ├── auth.js              # Registration & login
│   │   ├── google_auth.js       # Google OAuth
│   │   └── password_reset.js    # Password recovery
│   ├── utils/
│   │   └── email.js             # Email sending utility
│   ├── scripts/
│   │   └── init_db.js           # Database initialization
│   ├── schema.sql               # Database schema
│   ├── seeds/
│   │   └── countries.sql        # Country data
│   ├── db.js                    # Database connection
│   ├── index.js                 # Server entry point
│   └── .env.example             # Environment template
│
└── client/
    ├── src/
    │   ├── pages/
    │   │   ├── LoginPage.jsx           # Login UI
    │   │   ├── RegisterPage.jsx        # Registration UI
    │   │   ├── ForgotPasswordPage.jsx  # Password recovery request
    │   │   ├── ResetPasswordPage.jsx   # Password reset form
    │   │   └── DashboardPage.jsx       # Example protected page
    │   ├── components/
    │   │   └── LanguageSwitcher.jsx    # Language selector
    │   ├── i18n.js              # Internationalization config
    │   ├── App.jsx              # Routes
    │   └── main.jsx             # Entry point
    └── .env.example             # Environment template

```

## 🔧 Configuration

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized origins: `http://localhost:5173`
6. Copy Client ID to both `.env` files

### Email Service Setup

Choose one option:

**Option 1: Gmail** (Development)
- Enable 2-factor authentication
- Generate App Password
- Use in `SMTP_USER` and `SMTP_PASS`

**Option 2: SendGrid** (Production)
- Create free account
- Generate API key
- Configure in `.env`

**Option 3: Mailtrap** (Testing)
- Create free account
- Copy SMTP credentials
- All emails caught in Mailtrap inbox

## 🎨 Customization

### Branding
- Update `EMAIL_FROM` in server `.env`
- Replace background images in `LoginPage.jsx`
- Modify colors in CSS files
- Update app name in `i18n.js`

### Add New Languages
Edit `client/src/i18n.js`:
```javascript
resources: {
  en: { translation: { ... } },
  es: { translation: { ... } },
  fr: { translation: { ... } }  // Add new language
}
```

### Database Schema
Modify `server/schema.sql` and run:
```bash
node scripts/init_db.js
```

## 📚 API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/auth/google` - Google OAuth login

### Password Recovery
- `POST /api/password-reset/request` - Request password reset
- `POST /api/password-reset/reset` - Reset password with token

### Utilities
- `GET /api/countries` - Get country list
- `GET /api/health` - Health check

## 🧪 Testing

### Manual Testing Flow
1. Register a new user
2. Login with credentials
3. Test Google OAuth
4. Request password reset
5. Check email (Mailtrap)
6. Reset password
7. Login with new password

## 🚢 Deployment

### Backend (e.g., Heroku, Railway, Render)
1. Set environment variables
2. Configure production database
3. Update `FRONTEND_URL` to production URL

### Frontend (e.g., Vercel, Netlify)
1. Set `VITE_GOOGLE_CLIENT_ID`
2. Update API URLs to production backend

## 📝 License

MIT License - feel free to use in your projects!

## 🤝 Contributing

This is a template project. Fork it and customize for your needs!

## 📧 Support

For issues or questions, please open an issue on GitHub.

---

**Made with ❤️ for rapid full-stack development**
