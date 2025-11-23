# Customization Guide

## Branding & Styling

### App Name

**Update in multiple places**:

1. **Email templates** (`server/utils/email.js`):
```javascript
EMAIL_FROM="Your App Name <noreply@yourapp.com>"
```

2. **Translations** (`client/src/i18n.js`):
```javascript
"welcome_back": "Welcome back to Your App"
```

3. **HTML title** (`client/index.html`):
```html
<title>Your App Name</title>
```

### Colors & Theme

**Primary colors** are defined in:
- `client/src/index.css` - Global styles
- `client/src/pages/LoginPage.css` - Login page specific

**Example**: Change primary color from black to blue:
```css
/* Before */
background-color: #111827;

/* After */
background-color: #2563eb;
```

### Background Images

**Login page** (`client/src/pages/LoginPage.jsx`):
```javascript
// Full-screen background
backgroundImage: url('your-image-url')

// Side image in modal
<img src="your-image-url" alt="..." />
```

**Tips**:
- Use high-quality images (1920x1080+)
- Optimize for web (use WebP format)
- Consider using a CDN

## Adding New Languages

### 1. Add Translation Object

Edit `client/src/i18n.js`:

```javascript
resources: {
  en: { translation: { /* English */ } },
  es: { translation: { /* Spanish */ } },
  fr: {  // Add French
    translation: {
      "welcome_back": "Bon retour",
      "sign_in_details": "Veuillez entrer vos informations.",
      // ... add all keys
    }
  }
}
```

### 2. Update Language Switcher

Edit `client/src/components/LanguageSwitcher.jsx`:

```javascript
const languages = [
  { code: 'en', flag: 'gb' },
  { code: 'es', flag: 'es' },
  { code: 'fr', flag: 'fr' }  // Add French
];
```

## Database Schema Modifications

### Adding New Fields to Users

1. **Update schema** (`server/schema.sql`):
```sql
ALTER TABLE users ADD COLUMN phone VARCHAR(20);
```

2. **Run migration**:
```bash
node scripts/init_db.js
```

3. **Update registration** (`server/routes/auth.js`):
```javascript
const { email, password, phone } = req.body;
// Add phone to INSERT query
```

4. **Update frontend** (`client/src/pages/RegisterPage.jsx`):
```javascript
const [phone, setPhone] = useState('');
// Add input field
```

### Adding New Tables

1. Add to `server/schema.sql`:
```sql
CREATE TABLE IF NOT EXISTS your_table (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    -- your columns
);
```

2. Run migration:
```bash
node scripts/init_db.js
```

## API Customization

### Adding New Endpoints

Create new route file `server/routes/your_feature.js`:

```javascript
const express = require('express');
const router = express.Router();

router.get('/your-endpoint', async (req, res) => {
  // Your logic
  res.json({ message: 'Success' });
});

module.exports = router;
```

Register in `server/index.js`:
```javascript
const yourFeatureRoutes = require('./routes/your_feature');
app.use('/api/your-feature', yourFeatureRoutes);
```

### Modifying Existing Endpoints

Example: Add user role to registration response

Edit `server/routes/auth.js`:
```javascript
res.status(201).json({ 
  message: 'User registered successfully',
  user: {
    id: newUser.id,
    email: newUser.email,
    role: newUser.role  // Add this
  }
});
```

## Frontend Customization

### Adding New Pages

1. **Create page** (`client/src/pages/YourPage.jsx`):
```javascript
import React from 'react';

const YourPage = () => {
  return <div>Your Page Content</div>;
};

export default YourPage;
```

2. **Add route** (`client/src/App.jsx`):
```javascript
import YourPage from './pages/YourPage';

<Route path="/your-page" element={<YourPage />} />
```

### Modifying Form Validation

Edit validation in page components:

```javascript
// Example: Stronger password requirement
if (password.length < 12) {
  setError('Password must be at least 12 characters');
  return;
}

// Add complexity check
if (!/[A-Z]/.test(password)) {
  setError('Password must contain uppercase letter');
  return;
}
```

## Email Templates

### Customizing Password Reset Email

Edit `server/utils/email.js`:

```javascript
html: `
  <div style="font-family: Arial; max-width: 600px;">
    <h1>Your Custom Header</h1>
    <p>Your custom message</p>
    <a href="${resetUrl}" style="your-custom-styles">
      Reset Password
    </a>
    <footer>Your custom footer</footer>
  </div>
`
```

### Adding New Email Types

Create new function in `server/utils/email.js`:

```javascript
async function sendWelcomeEmail(email, name) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Welcome!',
    html: `<h1>Welcome ${name}!</h1>`
  };
  
  return await transporter.sendMail(mailOptions);
}

module.exports = {
  sendPasswordResetEmail,
  sendWelcomeEmail  // Export new function
};
```

## Security Enhancements

### Adding Rate Limiting

Install package:
```bash
npm install express-rate-limit
```

Add to `server/index.js`:
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### Adding JWT Authentication

Install package:
```bash
npm install jsonwebtoken
```

Create middleware `server/middleware/auth.js`:
```javascript
const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) return res.sendStatus(401);
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

module.exports = { authenticateToken };
```

## Environment-Specific Configuration

### Development vs Production

Create `server/config/index.js`:

```javascript
const config = {
  development: {
    frontendUrl: 'http://localhost:5173',
    corsOrigin: 'http://localhost:5173'
  },
  production: {
    frontendUrl: 'https://yourapp.com',
    corsOrigin: 'https://yourapp.com'
  }
};

module.exports = config[process.env.NODE_ENV || 'development'];
```

Use in code:
```javascript
const config = require('./config');
// Use config.frontendUrl instead of hardcoded URL
```

## Testing

### Adding Unit Tests

Install Jest:
```bash
npm install --save-dev jest supertest
```

Create test file `server/routes/__tests__/auth.test.js`:
```javascript
const request = require('supertest');
const app = require('../index');

describe('POST /api/register', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    
    expect(res.statusCode).toBe(201);
  });
});
```

## Deployment Checklist

- [ ] Update all environment variables for production
- [ ] Change `FRONTEND_URL` to production URL
- [ ] Configure production database
- [ ] Set up production email service
- [ ] Enable HTTPS
- [ ] Add rate limiting
- [ ] Set up monitoring/logging
- [ ] Configure CORS for production domain
- [ ] Remove console.logs
- [ ] Add error tracking (Sentry, etc.)

---

**Need help?** Check the main [README.md](../README.md) or open an issue!
