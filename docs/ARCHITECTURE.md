# System Architecture

## Overview

CMMV Blog is a monorepo-based Content Management System (CMS) built on the Contract-Model-Model-View (CMMV) architecture pattern. The system is designed to be framework-agnostic, supporting Vue.js, React, Angular, and vanilla JavaScript applications.

## Architecture Principles

### Contract-Based Development

The core principle of CMMV is contract-based development:
- **Contracts**: Type-safe interfaces defining data structures and API contracts
- **Models**: Business logic and data manipulation
- **Views**: Framework-specific implementations (Vue, React, etc.)
- **Client API**: Unified interface across all frameworks

### Monorepo Structure

```
cmmv-blog/
├── packages/          # Core modules/packages
│   ├── plugin/       # Main blog plugin
│   ├── access-control/  # Authentication & authorization
│   ├── rss-aggregation/ # RSS feed aggregation
│   ├── affiliate/     # Affiliate marketing
│   ├── odds/         # Odds/sports betting
│   ├── newsletter/   # Newsletter management
│   ├── ai-content/   # AI content generation
│   └── yt-aggregation/ # YouTube content aggregation
├── apps/             # Applications
│   ├── api/          # Backend API server
│   ├── admin/        # Admin dashboard (Vue.js)
│   └── web/          # Public-facing website
└── docs/             # Documentation
```

## Core Components

### 1. Plugin Package (`@cmmv/blog`)

The main blog plugin providing:
- **API Layer**: RESTful endpoints for blog operations
- **Admin Interface**: Vue.js-based admin dashboard
- **Client API**: Framework-agnostic client libraries
- **Contracts**: TypeScript type definitions

### 2. API Server (`apps/api`)

Backend server built with:
- RESTful API endpoints
- Database integration (SQLite by default)
- File storage abstraction (local/Cloudflare Spaces/AWS S3)
- Media processing (image optimization, WebP conversion)
- RSS feed processing
- Web scraping capabilities

### 3. Admin Dashboard (`apps/admin`)

Vue.js-based administration interface:
- Content management (articles, categories, tags)
- Media library management
- User management
- RSS feed configuration
- System settings

### 4. Public Web App (`apps/web`)

Multi-theme public-facing website:
- Server-side rendering (SSR) support
- Multiple theme support (default, custom themes)
- SEO optimization
- Analytics integration

## Data Flow

### Content Creation Flow

```
1. Admin creates content → Admin Dashboard (Vue)
2. API validates & stores → API Server
3. Content persisted → Database (SQLite)
4. Media uploaded → Storage (local/S3/Cloudflare)
5. Content published → Available via API
```

### Content Consumption Flow

```
1. Client requests content → Client API
2. API fetches from database → API Server
3. Data returned → Type-safe Contracts
4. Framework renders → Vue/React/Angular/vanilla JS
```

## Module Architecture

### RSS Aggregation Module

- **Purpose**: Aggregate news from RSS feeds and web scraping
- **Features**:
  - RSS/Atom feed parsing
  - Web scraping for sites with limited RSS
  - Image extraction and processing
  - Content extraction from article pages
  - Automatic article creation

### Access Control Module

- **Purpose**: Authentication and authorization
- **Features**:
  - User management
  - Role-based access control (RBAC)
  - Group management
  - Permission system

### Affiliate Module

- **Purpose**: Affiliate marketing management
- **Features**:
  - Campaign management
  - Coupon management
  - Deep linking
  - Network integration

### AI Content Module

- **Purpose**: AI-powered content generation
- **Features**:
  - Content generation using AI
  - Content enhancement
  - Quality validation

## Storage Architecture

### Media Storage

Supports multiple storage backends:
- **Local Storage**: Default (`medias/images/`)
- **Cloudflare Spaces**: CDN storage
- **AWS S3**: Cloud storage

### Image Processing Pipeline

1. **Upload**: Image uploaded via API
2. **Validation**: Format and dimension checks
3. **Optimization**: Resize, compress, convert to WebP
4. **Storage**: Save to configured backend
5. **Database**: Store metadata (sha1, dimensions, format)

See `docs/MEDIA_STORAGE_ARCHITECTURE.md` for detailed information.

## API Design

### RESTful Principles

- **Resources**: Articles, categories, tags, media, users
- **HTTP Methods**: GET, POST, PUT, DELETE
- **Status Codes**: Standard HTTP status codes
- **Authentication**: JWT-based authentication

### Contract Types

All API responses follow TypeScript contracts:
- Type safety at compile time
- Consistent data structures
- Automatic API client generation

## Technology Stack

### Backend

- **Runtime**: Node.js (>= 20.0.0)
- **Language**: TypeScript (strict mode)
- **Database**: SQLite (configurable)
- **Image Processing**: Sharp library
- **Web Scraping**: Custom service with regex parsing

### Frontend

- **Admin**: Vue.js 3 + TypeScript
- **Public**: Multi-framework support (Vue/React/Angular)
- **Build Tool**: Vite
- **Styling**: Tailwind CSS (in admin)

### Development Tools

- **Package Manager**: pnpm (workspaces)
- **Build System**: Turbo (monorepo)
- **Testing**: Vitest (target: 95% coverage)
- **Linting**: ESLint
- **Formatting**: Prettier
- **Quality**: @hivellm/rulebook

## Deployment Architecture

### Development

- Local development with hot reload
- SQLite database
- Local file storage

### Production

- API server deployment (PM2/Docker)
- Database: SQLite or PostgreSQL (configurable)
- Media storage: Cloudflare Spaces or AWS S3
- CDN: For static assets and media

## Security Considerations

- JWT authentication
- Role-based access control
- Input validation and sanitization
- SQL injection prevention (parameterized queries)
- XSS prevention (framework auto-escaping)
- Secure file upload validation
- HTTPS enforcement in production

## Performance Optimizations

- Image optimization and WebP conversion
- RSS feed caching
- Database query optimization
- CDN integration for media
- Server-side rendering for SEO

See `docs/PERFORMANCE_OPTIMIZATION.md` for detailed optimizations.

## Future Considerations

- Multi-database support (PostgreSQL, MySQL)
- GraphQL API option
- Real-time updates (WebSockets)
- Advanced caching strategies
- Microservices architecture option

## Related Documentation

- `docs/MEDIA_STORAGE_ARCHITECTURE.md` - Media storage details
- `docs/PERFORMANCE_OPTIMIZATION.md` - Performance optimizations
- `docs/WEB_SCRAPING_IMPLEMENTATION_PLAN.md` - Web scraping details
- `AGENTS.md` - Development rules and standards

