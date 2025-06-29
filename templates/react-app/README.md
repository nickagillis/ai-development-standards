# React Application Template

🚀 **Production-ready React application template with Claude Desktop integration**

## Features

- ⚡ **Modern React 18** with hooks and concurrent features
- 🎨 **Tailwind CSS** for utility-first styling
- 📱 **Responsive design** that works on all devices
- 🔧 **TypeScript** for type safety and better DX
- 🧪 **Comprehensive testing** with Jest and React Testing Library
- 📦 **Build optimization** with Vite
- 🔍 **Code quality** with ESLint and Prettier
- 🚀 **Production deployment** ready
- 🤖 **Claude Desktop MCP** integration examples

## Quick Start

```bash
# Clone the template
git clone https://github.com/nickagillis/ai-development-standards.git
cd ai-development-standards/templates/react-app

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173
```

## Project Structure

```
react-app/
├── public/                 # Static assets
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── common/       # Generic components (Button, Modal, etc.)
│   │   ├── layout/       # Layout components (Header, Footer, etc.)
│   │   └── features/     # Feature-specific components
│   ├── hooks/            # Custom React hooks
│   ├── services/         # API calls and external services
│   ├── utils/            # Helper functions
│   ├── types/            # TypeScript type definitions
│   ├── styles/           # Global styles and Tailwind config
│   ├── App.tsx           # Main application component
│   └── main.tsx          # Application entry point
├── tests/                # Test files
├── .env.example          # Environment variables template
├── package.json          # Dependencies and scripts
├── vite.config.ts        # Vite configuration
├── tailwind.config.js    # Tailwind CSS configuration
└── tsconfig.json         # TypeScript configuration
```

## Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run preview          # Preview production build

# Building
npm run build            # Create production build
npm run build:analyze    # Analyze bundle size

# Testing
npm test                 # Run tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage

# Code Quality
npm run lint             # Check code quality
npm run lint:fix         # Fix linting issues
npm run format           # Format code with Prettier
npm run type-check       # Check TypeScript types

# Validation
npm run validate         # Run all quality checks
```

## Environment Setup

```bash
# Copy environment template
cp .env.example .env.local

# Configure your environment variables
VITE_API_URL=http://localhost:3001
VITE_APP_NAME="My React App"
VITE_ENABLE_MCP=true
```

## Claude Desktop Integration

### MCP Configuration Example

```json
{
  "mcpServers": {
    "react-dev": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "./src"],
      "env": {}
    }
  }
}
```

### AI-Powered Development Features

- **Component Generation**: Use Claude to generate components from descriptions
- **Code Review**: Automated code quality analysis
- **Testing**: Generate test cases based on component behavior
- **Optimization**: Performance improvement suggestions

## Core Components

### Button Component

```typescript
// src/components/common/Button.tsx
import { ButtonHTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  loading?: boolean;
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  loading, 
  className,
  disabled,
  ...props 
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center font-medium transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        {
          // Variants
          'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500': variant === 'primary',
          'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500': variant === 'secondary',
          'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500': variant === 'outline',
          
          // Sizes
          'px-3 py-2 text-sm': size === 'sm',
          'px-4 py-2 text-base': size === 'md',
          'px-6 py-3 text-lg': size === 'lg',
          
          // States
          'opacity-50 cursor-not-allowed': disabled || loading,
        },
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  );
}
```

### API Service Hook

```typescript
// src/hooks/useApi.ts
import { useState, useEffect } from 'react';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApi<T>(url: string, options?: RequestInit): ApiState<T> {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        
        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
          },
          ...options,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (!cancelled) {
          setState({ data, loading: false, error: null });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            data: null,
            loading: false,
            error: error instanceof Error ? error.message : 'An error occurred',
          });
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [url]);

  return state;
}
```

## Testing Strategy

### Component Testing

```typescript
// tests/components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../src/components/common/Button';

describe('Button Component', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    render(<Button loading>Loading</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(screen.getByRole('button')).toHaveClass('opacity-50');
  });

  it('applies variant styles correctly', () => {
    render(<Button variant="outline">Outline</Button>);
    
    expect(screen.getByRole('button')).toHaveClass('border', 'border-gray-300');
  });
});
```

### API Hook Testing

```typescript
// tests/hooks/useApi.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useApi } from '../src/hooks/useApi';

// Mock fetch
global.fetch = jest.fn();

describe('useApi Hook', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('fetches data successfully', async () => {
    const mockData = { id: 1, name: 'Test' };
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const { result } = renderHook(() => useApi('/api/test'));

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBe(null);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBe(null);
  });

  it('handles fetch errors', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    const { result } = renderHook(() => useApi('/api/test'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe('HTTP error! status: 404');
  });
});
```

## Performance Optimization

### Code Splitting

```typescript
// src/App.tsx
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Loading } from './components/common/Loading';

// Lazy load components
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Dashboard = lazy(() => import('./pages/Dashboard'));

export function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
```

### Bundle Analysis

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
        },
      },
    },
  },
});
```

## Deployment

### Vercel Deployment

```json
// vercel.json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "buildCommand": "npm run build",
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

### Netlify Deployment

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Best Practices

### Component Guidelines

1. **Single Responsibility**: Each component should have one clear purpose
2. **Props Interface**: Always define TypeScript interfaces for props
3. **Default Props**: Use default parameters instead of defaultProps
4. **Error Boundaries**: Wrap components that might fail
5. **Accessibility**: Always include proper ARIA attributes

### State Management

1. **Local State**: Use useState for component-specific state
2. **Shared State**: Use Context API for app-wide state
3. **Server State**: Use custom hooks for API data
4. **Form State**: Use controlled components with validation

### Performance Tips

1. **Memoization**: Use React.memo for expensive components
2. **Callbacks**: Use useCallback for event handlers
3. **Values**: Use useMemo for expensive calculations
4. **Images**: Optimize and lazy load images
5. **Bundling**: Implement code splitting for large apps

## Troubleshooting

### Common Issues

**Build fails with TypeScript errors:**
```bash
npm run type-check
# Fix any TypeScript issues
```

**Tests failing:**
```bash
npm run test:coverage
# Check which tests are failing and why
```

**Bundle size too large:**
```bash
npm run build:analyze
# Identify large dependencies and optimize
```

**Development server slow:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Contributing

When adding new features:

1. **Follow naming conventions**: PascalCase for components, camelCase for functions
2. **Add tests**: Every new component and hook should have tests
3. **Update documentation**: Keep README and inline docs current
4. **Run validation**: `npm run validate` before committing
5. **Use Claude Desktop**: Leverage MCP tools for code generation and review

---

**Built with ❤️ using AI Development Standards** 🚀

*This template follows all production-ready practices and integrates seamlessly with Claude Desktop for AI-powered development.*