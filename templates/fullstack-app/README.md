# Full-Stack Application Template

🚀 **Production-ready full-stack application with React frontend, Node.js backend, and Claude Desktop integration**

## Architecture Overview

```
📦 fullstack-app/
├── 🎨 frontend/          # React TypeScript application
│   ├── src/
│   ├── public/
│   └── package.json
├── ⚙️  backend/           # Node.js Express API
│   ├── src/
│   ├── tests/
│   └── package.json
├── 🗄️  database/          # Database setup and migrations
│   ├── migrations/
│   ├── seeds/
│   └── schema.sql
├── 🚀 deployment/        # Docker and deployment configs
│   ├── docker-compose.yml
│   ├── Dockerfile.frontend
│   ├── Dockerfile.backend
│   └── nginx.conf
└── 📚 docs/              # Documentation
    ├── api.md
    ├── deployment.md
    └── development.md
```

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Query** for server state management
- **React Router** for navigation
- **Axios** for API communication
- **React Hook Form** for form management

### Backend
- **Node.js** with TypeScript
- **Express.js** web framework
- **PostgreSQL** database
- **Prisma** ORM
- **JWT** authentication
- **Zod** for validation
- **Winston** for logging

### DevOps
- **Docker** for containerization
- **Nginx** for reverse proxy
- **GitHub Actions** for CI/CD
- **Jest** for testing
- **ESLint & Prettier** for code quality

## Quick Start

### Prerequisites

```bash
# Required software
- Node.js 18+
- PostgreSQL 14+
- Docker (optional but recommended)
- Claude Desktop with MCP
```

### Development Setup

```bash
# Clone the template
git clone https://github.com/nickagillis/ai-development-standards.git
cd ai-development-standards/templates/fullstack-app

# Install dependencies for both frontend and backend
npm run install:all

# Setup database
docker-compose up -d postgres
npm run db:setup

# Start development servers
npm run dev

# Frontend: http://localhost:3000
# Backend: http://localhost:3001
# Database: postgresql://localhost:5432/app_dev
```

### Claude Desktop Integration

```json
// claude_desktop_config.json
{
  "mcpServers": {
    "fullstack-dev": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "./"],
      "env": {}
    },
    "database": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "DATABASE_URL": "postgresql://user:password@localhost:5432/app_dev"
      }
    }
  }
}
```

## Project Structure

### Frontend Structure

```
frontend/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── ui/          # Basic UI components (Button, Input, etc.)
│   │   ├── forms/       # Form components
│   │   ├── layout/      # Layout components
│   │   └── features/    # Feature-specific components
│   ├── hooks/           # Custom React hooks
│   ├── services/        # API service functions
│   ├── utils/           # Utility functions
│   ├── types/           # TypeScript type definitions
│   ├── stores/          # State management
│   ├── pages/           # Page components
│   └── App.tsx          # Main app component
├── public/              # Static assets
├── tests/               # Frontend tests
└── package.json         # Frontend dependencies
```

### Backend Structure

```
backend/
├── src/
│   ├── controllers/     # Route handlers
│   ├── middleware/      # Express middleware
│   ├── models/          # Database models (Prisma)
│   ├── routes/          # API route definitions
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   ├── validation/      # Zod schemas
│   ├── config/          # Configuration files
│   └── server.ts        # Express server setup
├── tests/               # Backend tests
├── prisma/              # Database schema and migrations
└── package.json         # Backend dependencies
```

## Available Scripts

### Root Level Scripts

```bash
# Development
npm run dev              # Start both frontend and backend
npm run dev:frontend     # Start only frontend
npm run dev:backend      # Start only backend

# Installation
npm run install:all      # Install all dependencies
npm run install:frontend # Install frontend dependencies
npm run install:backend  # Install backend dependencies

# Database
npm run db:setup         # Setup database and run migrations
npm run db:migrate       # Run database migrations
npm run db:seed          # Seed database with sample data
npm run db:reset         # Reset database

# Testing
npm test                 # Run all tests
npm run test:frontend    # Run frontend tests
npm run test:backend     # Run backend tests
npm run test:e2e         # Run end-to-end tests

# Building
npm run build            # Build both frontend and backend
npm run build:frontend   # Build frontend
npm run build:backend    # Build backend

# Docker
npm run docker:up        # Start with Docker
npm run docker:down      # Stop Docker containers
npm run docker:build     # Build Docker images

# Validation
npm run validate         # Run all quality checks
npm run lint             # Lint all code
npm run format           # Format all code
```

## API Design

### Authentication

```typescript
// backend/src/routes/auth.ts
import { Router } from 'express';
import { z } from 'zod';
import { authController } from '../controllers/authController';
import { validateRequest } from '../middleware/validation';

const router = Router();

const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(2),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string(),
  }),
});

router.post('/register', validateRequest(registerSchema), authController.register);
router.post('/login', validateRequest(loginSchema), authController.login);
router.post('/logout', authController.logout);
router.get('/me', authController.getProfile);

export { router as authRoutes };
```

### Database Models

```prisma
// backend/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  password  String
  role      Role     @default(USER)
  posts     Post[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}

model Post {
  id        String   @id @default(cuid())
  title     String
  content   String?
  published Boolean  @default(false)
  author    User     @relation(fields: [authorId], references: [id])
  authorId  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("posts")
}

enum Role {
  USER
  ADMIN
}
```

### API Service (Frontend)

```typescript
// frontend/src/services/api.ts
import axios from 'axios';
import { User, Post, LoginRequest, RegisterRequest } from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (data: LoginRequest) => api.post<{ user: User; token: string }>('/auth/login', data),
  register: (data: RegisterRequest) => api.post<{ user: User; token: string }>('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get<User>('/auth/me'),
};

export const postsApi = {
  getPosts: () => api.get<Post[]>('/posts'),
  getPost: (id: string) => api.get<Post>(`/posts/${id}`),
  createPost: (data: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>) => api.post<Post>('/posts', data),
  updatePost: (id: string, data: Partial<Post>) => api.put<Post>(`/posts/${id}`, data),
  deletePost: (id: string) => api.delete(`/posts/${id}`),
};
```

## Frontend Components

### Authentication Hook

```typescript
// frontend/src/hooks/useAuth.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';
import { authApi } from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuth = create<AuthState>()(persist(
  (set, get) => ({
    user: null,
    token: null,
    isAuthenticated: false,

    login: async (email: string, password: string) => {
      try {
        const response = await authApi.login({ email, password });
        const { user, token } = response.data;
        
        localStorage.setItem('authToken', token);
        set({ user, token, isAuthenticated: true });
      } catch (error) {
        throw new Error('Login failed');
      }
    },

    register: async (email: string, password: string, name: string) => {
      try {
        const response = await authApi.register({ email, password, name });
        const { user, token } = response.data;
        
        localStorage.setItem('authToken', token);
        set({ user, token, isAuthenticated: true });
      } catch (error) {
        throw new Error('Registration failed');
      }
    },

    logout: () => {
      localStorage.removeItem('authToken');
      set({ user: null, token: null, isAuthenticated: false });
    },

    checkAuth: async () => {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      try {
        const response = await authApi.getProfile();
        set({ user: response.data, token, isAuthenticated: true });
      } catch (error) {
        localStorage.removeItem('authToken');
        set({ user: null, token: null, isAuthenticated: false });
      }
    },
  }),
  {
    name: 'auth-storage',
    partialize: (state) => ({ 
      token: state.token,
      isAuthenticated: state.isAuthenticated 
    }),
  }
));
```

### Protected Route Component

```typescript
// frontend/src/components/auth/ProtectedRoute.tsx
import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Loading } from '../ui/Loading';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
}

export function ProtectedRoute({ children, requireAuth = true }: ProtectedRouteProps) {
  const { isAuthenticated, checkAuth } = useAuth();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth().finally(() => setIsLoading(false));
  }, [checkAuth]);

  if (isLoading) {
    return <Loading />;
  }

  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!requireAuth && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
```

## Backend Implementation

### Controller Example

```typescript
// backend/src/controllers/authController.ts
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

export const authController = {
  register: async (req: Request, res: Response) => {
    try {
      const { email, password, name } = req.body;

      // Check if user exists
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });

      // Generate token
      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      logger.info(`User registered: ${user.id}`);
      res.status(201).json({ user, token });
    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  login: async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate token
      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;

      logger.info(`User logged in: ${user.id}`);
      res.json({ user: userWithoutPassword, token });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  getProfile: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId; // Set by auth middleware

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(user);
    } catch (error) {
      logger.error('Get profile error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  logout: async (req: Request, res: Response) => {
    // In a more complex setup, you might invalidate the token
    res.json({ message: 'Logged out successfully' });
  },
};
```

### Authentication Middleware

```typescript
// backend/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    
    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    (req as any).userId = user.id;
    (req as any).userRole = user.role;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req as any).userRole;
    
    if (!roles.includes(userRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};
```

## Testing Strategy

### Frontend Testing

```typescript
// frontend/tests/components/LoginForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LoginForm } from '../../src/components/auth/LoginForm';
import { useAuth } from '../../src/hooks/useAuth';

// Mock the auth hook
jest.mock('../../src/hooks/useAuth');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('LoginForm', () => {
  const mockLogin = jest.fn();

  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      login: mockLogin,
      user: null,
      isAuthenticated: false,
    } as any);
  });

  it('renders login form', () => {
    renderWithRouter(<LoginForm />);
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('submits form with correct data', async () => {
    mockLogin.mockResolvedValue(undefined);
    
    renderWithRouter(<LoginForm />);
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('displays error message on login failure', async () => {
    mockLogin.mockRejectedValue(new Error('Login failed'));
    
    renderWithRouter(<LoginForm />);
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrongpassword' },
    });
    
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/login failed/i)).toBeInTheDocument();
    });
  });
});
```

### Backend Testing

```typescript
// backend/tests/controllers/authController.test.ts
import request from 'supertest';
import { app } from '../../src/server';
import { prisma } from '../../src/config/database';

describe('Auth Controller', () => {
  beforeEach(async () => {
    // Clean database before each test
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/auth/register', () => {
    it('creates a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.user).toMatchObject({
        email: userData.email,
        name: userData.name,
      });
      expect(response.body.user.password).toBeUndefined();
      expect(response.body.token).toBeDefined();
    });

    it('returns error for duplicate email', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      // Create user first
      await request(app).post('/api/auth/register').send(userData);

      // Try to create again
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).toBe('User already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      await request(app).post('/api/auth/register').send({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      });
    });

    it('logs in with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(200);

      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.token).toBeDefined();
    });

    it('returns error for incorrect credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.error).toBe('Invalid credentials');
    });
  });
});
```

## Docker Deployment

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: deployment/Dockerfile.frontend
    ports:
      - "3000:80"
    environment:
      - VITE_API_URL=http://localhost:3001/api
    depends_on:
      - backend

  backend:
    build:
      context: .
      dockerfile: deployment/Dockerfile.backend
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/app_prod
      - JWT_SECRET=your-super-secret-jwt-key
      - NODE_ENV=production
    depends_on:
      - postgres
    volumes:
      - ./logs:/app/logs

  postgres:
    image: postgres:14-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_DB=app_prod
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./deployment/nginx.conf:/etc/nginx/nginx.conf
      - ./deployment/ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend

volumes:
  postgres_data:
```

### Production Deployment

```bash
# Build and deploy
npm run docker:build
npm run docker:up

# Or deploy to cloud provider
npm run deploy:aws
npm run deploy:gcp
npm run deploy:azure
```

## Monitoring & Observability

### Health Checks

```typescript
// backend/src/routes/health.ts
import { Router } from 'express';
import { prisma } from '../config/database';

const router = Router();

router.get('/health', async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed',
    });
  }
});

export { router as healthRoutes };
```

### Logging

```typescript
// backend/src/utils/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'fullstack-app' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

export { logger };
```

## Best Practices

### Security

1. **Environment Variables**: Store sensitive data in environment variables
2. **Input Validation**: Validate all inputs using Zod schemas
3. **Authentication**: Use JWT tokens with proper expiration
4. **HTTPS**: Always use HTTPS in production
5. **CORS**: Configure CORS properly for your domains
6. **Rate Limiting**: Implement rate limiting for API endpoints
7. **SQL Injection**: Use Prisma ORM to prevent SQL injection
8. **XSS Protection**: Sanitize user inputs and use CSP headers

### Performance

1. **Database Indexing**: Add proper indexes to database columns
2. **Query Optimization**: Use Prisma's query optimization features
3. **Caching**: Implement Redis caching for frequently accessed data
4. **Code Splitting**: Use React's lazy loading for better performance
5. **Image Optimization**: Optimize and compress images
6. **Bundle Analysis**: Regularly analyze and optimize bundle size

### Development

1. **TypeScript**: Use TypeScript for type safety
2. **Testing**: Write comprehensive tests for both frontend and backend
3. **Documentation**: Keep API documentation updated
4. **Code Quality**: Use ESLint and Prettier for consistent code style
5. **Git Hooks**: Set up pre-commit hooks for quality checks
6. **CI/CD**: Implement automated testing and deployment

## Troubleshooting

### Common Issues

**Database connection fails:**
```bash
# Check if PostgreSQL is running
docker-compose ps

# Check database logs
docker-compose logs postgres

# Reset database
npm run db:reset
```

**Frontend build fails:**
```bash
# Clear node_modules and reinstall
rm -rf frontend/node_modules frontend/package-lock.json
cd frontend && npm install

# Check TypeScript errors
npm run type-check
```

**Authentication issues:**
```bash
# Check JWT secret is set
echo $JWT_SECRET

# Check token in browser storage
# Open DevTools > Application > Local Storage
```

**CORS errors:**
```typescript
// backend/src/server.ts - Add CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
```

## Contributing

When contributing to this template:

1. **Follow conventions**: Use established naming and structure patterns
2. **Add tests**: Every new feature should include tests
3. **Update docs**: Keep documentation current with changes
4. **Type safety**: Ensure all code is properly typed
5. **Security**: Follow security best practices
6. **Performance**: Consider performance implications
7. **Use Claude Desktop**: Leverage MCP tools for development assistance

---

**Built with ❤️ using AI Development Standards** 🚀

*This full-stack template provides a production-ready foundation with modern best practices, comprehensive testing, and seamless Claude Desktop integration for AI-powered development.*