# Security Guidelines

## 🛡️ Security Best Practices for AI-Generated Code

Security is paramount in all AI development projects. These guidelines ensure every application is built with security-first principles.

---

## 🔐 Input Validation & Sanitization

### **Universal Input Validation Rules**
```javascript
// ALWAYS validate input at the API boundary
app.post('/api/users', validateInput, (req, res) => {
  // Input is guaranteed to be valid here
});

// Use schema validation (Joi, Yup, etc.)
const userSchema = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().min(2).max(50).required(),
  age: Joi.number().integer().min(13).max(120)
});
```

### **Required Validations:**
- [ ] **Type Checking** - Ensure correct data types
- [ ] **Length Limits** - Strings, arrays, and objects have size limits
- [ ] **Format Validation** - Email, URL, phone number formats
- [ ] **Range Validation** - Numbers within acceptable ranges
- [ ] **Character Whitelisting** - Only allow safe characters

### **Sanitization Patterns:**
```javascript
// HTML sanitization
const sanitizedInput = DOMPurify.sanitize(userInput);

// SQL injection prevention (use parameterized queries)
const query = 'SELECT * FROM users WHERE email = ?';
db.query(query, [email], callback);

// NoSQL injection prevention
const safeFilter = { email: { $eq: email } };
```

---

## 🔑 Authentication & Authorization

### **Authentication Requirements:**
- [ ] **Strong Passwords** - Minimum 8 characters, complexity requirements
- [ ] **Password Hashing** - Use bcrypt, scrypt, or Argon2
- [ ] **Session Management** - Secure session tokens with expiration
- [ ] **Multi-Factor Authentication** - For sensitive applications

### **Authorization Patterns:**
```javascript
// Role-based access control
const requireRole = (role) => (req, res, next) => {
  if (req.user.role !== role) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
};

// Resource-based authorization
const requireOwnership = async (req, res, next) => {
  const resource = await Resource.findById(req.params.id);
  if (resource.userId !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
};
```

### **JWT Security:**
```javascript
// Secure JWT configuration
const jwtOptions = {
  expiresIn: '15m',           // Short expiration
  algorithm: 'HS256',         // Strong algorithm
  issuer: 'your-app-name',    // Identify issuer
  audience: 'your-app-users'  // Identify audience
};

// Always verify JWT properly
jwt.verify(token, process.env.JWT_SECRET, jwtOptions, callback);
```

---

## 🌐 Network Security

### **HTTPS & TLS:**
- [ ] **Force HTTPS** - Redirect all HTTP to HTTPS
- [ ] **TLS 1.2+** - Use modern TLS versions only
- [ ] **HSTS Headers** - Enforce HTTPS in browsers
- [ ] **Certificate Validation** - Proper SSL certificate setup

### **Security Headers:**
```javascript
// Essential security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

### **CORS Configuration:**
```javascript
// Secure CORS setup
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
```

---

## 💾 Data Protection

### **Sensitive Data Handling:**
- [ ] **Data Classification** - Identify sensitive data types
- [ ] **Encryption at Rest** - Encrypt sensitive database fields
- [ ] **Encryption in Transit** - HTTPS for all communications
- [ ] **Data Minimization** - Only collect necessary data

### **Database Security:**
```javascript
// Encrypted sensitive fields
const userSchema = new mongoose.Schema({
  email: { type: String, required: true },
  passwordHash: { type: String, required: true },
  socialSecurityNumber: {
    type: String,
    set: encrypt,    // Encrypt before saving
    get: decrypt     // Decrypt when retrieving
  }
});

// Connection security
const dbConnection = mongoose.connect(process.env.DATABASE_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  ssl: true,
  sslValidate: true
});
```

### **PII Protection:**
- [ ] **Data Masking** - Hide sensitive data in logs and responses
- [ ] **Access Logging** - Log who accesses sensitive data
- [ ] **Data Retention** - Automatic deletion of old sensitive data
- [ ] **Export Controls** - Secure data export functionality

---

## 🔧 Environment Security

### **Environment Variables:**
```bash
# .env.example - Document all required variables
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
JWT_SECRET=your-super-secret-jwt-key-here
API_KEY=your-api-key-here
NODE_ENV=development
```

### **Secrets Management:**
- [ ] **Never in Code** - No hardcoded secrets ever
- [ ] **Environment Variables** - Use .env files for development
- [ ] **Secret Managers** - Use AWS Secrets Manager, Azure Key Vault, etc. in production
- [ ] **Rotation Policy** - Regular secret rotation schedule

### **Docker Security:**
```dockerfile
# Run as non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs

# Remove package managers
RUN apk del .build-deps

# Use specific versions
FROM node:18.17.0-alpine
```

---

## 🚨 Error Handling & Logging

### **Secure Error Responses:**
```javascript
// Development vs Production error handling
const errorHandler = (err, req, res, next) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Log full error details for debugging
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    user: req.user?.id
  });
  
  // Send safe error response to client
  res.status(err.statusCode || 500).json({
    success: false,
    message: isDevelopment ? err.message : 'Internal server error',
    // Never send stack traces to production clients
    ...(isDevelopment && { stack: err.stack })
  });
};
```

### **Secure Logging:**
- [ ] **No Sensitive Data** - Never log passwords, tokens, or PII
- [ ] **Structured Logging** - Use consistent log format
- [ ] **Log Rotation** - Prevent disk space issues
- [ ] **Centralized Logging** - Send logs to centralized system

---

## 📦 Dependency Security

### **Package Management:**
```json
// package.json security configurations
{
  "scripts": {
    "audit": "npm audit",
    "audit-fix": "npm audit fix",
    "security-check": "npm audit --audit-level moderate"
  },
  "engines": {
    "node": ">=18.17.0",
    "npm": ">=9.0.0"
  }
}
```

### **Dependency Guidelines:**
- [ ] **Minimal Dependencies** - Only include necessary packages
- [ ] **Version Pinning** - Use exact versions in package-lock.json
- [ ] **Regular Updates** - Schedule regular dependency updates
- [ ] **Security Audits** - Run npm audit regularly
- [ ] **License Compliance** - Check package licenses

### **Automated Security Scanning:**
```yaml
# .github/workflows/security.yml
name: Security Scan
on: [push, pull_request]
jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run security audit
        run: npm audit --audit-level moderate
      - name: Run Snyk security scan
        uses: snyk/actions/node@master
```

---

## 🔍 Security Testing

### **Required Security Tests:**
- [ ] **Input Validation Tests** - Test with malicious inputs
- [ ] **Authentication Tests** - Test auth bypass attempts
- [ ] **Authorization Tests** - Test privilege escalation
- [ ] **SQL Injection Tests** - Test database injection attacks
- [ ] **XSS Tests** - Test cross-site scripting vulnerabilities

### **Security Test Examples:**
```javascript
// Test SQL injection protection
describe('SQL Injection Protection', () => {
  it('should reject malicious SQL in user input', async () => {
    const maliciousInput = "'; DROP TABLE users; --";
    const response = await request(app)
      .post('/api/users')
      .send({ name: maliciousInput });
    
    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Invalid input');
  });
});

// Test authentication bypass
describe('Authentication', () => {
  it('should reject requests without valid tokens', async () => {
    const response = await request(app)
      .get('/api/protected-resource')
      .set('Authorization', 'Bearer invalid-token');
    
    expect(response.status).toBe(401);
  });
});
```

---

## 🚨 Security Incident Response

### **Incident Response Plan:**
1. **Detection** - Monitoring and alerting systems
2. **Assessment** - Determine severity and impact
3. **Containment** - Limit damage and prevent spread
4. **Eradication** - Remove the threat
5. **Recovery** - Restore normal operations
6. **Lessons Learned** - Improve security measures

### **Emergency Contacts:**
- [ ] **Security Team** - Internal security contacts
- [ ] **Infrastructure Team** - System administrators
- [ ] **Legal Team** - For compliance and legal issues
- [ ] **External Partners** - Security vendors, hosting providers

---

## ✅ Security Checklist Summary

Before deploying any application:

- [ ] All input validation implemented
- [ ] Authentication and authorization working
- [ ] HTTPS enforced with security headers
- [ ] Sensitive data properly encrypted
- [ ] Environment variables secured
- [ ] Dependencies scanned for vulnerabilities
- [ ] Security tests passing
- [ ] Error handling doesn't leak information
- [ ] Logging configured securely
- [ ] Incident response plan in place

---

**Security is not optional - it's a fundamental requirement for every application we build!** 🛡️✨
