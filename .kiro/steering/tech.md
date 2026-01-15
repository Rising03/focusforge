# Technology Stack

## Frontend

- **Framework**: React 19 with TypeScript (strict mode enabled)
- **Build Tool**: Vite (using Rolldown variant `rolldown-vite@7.2.5`)
- **Styling**: Tailwind CSS with custom design system
- **State Management**: React hooks and Context API
- **Routing**: React Router DOM v6
- **Charts**: Recharts for data visualization
- **Testing**: Jest + React Testing Library + fast-check (property-based testing)
- **PWA**: vite-plugin-pwa with Workbox

## Backend

- **Runtime**: Node.js v18+ with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL 15+ with raw SQL queries (no ORM)
- **Authentication**: JWT (access + refresh tokens) + Google OAuth 2.0
- **AI Integration**: Google Gemini API (`@google/generative-ai`)
- **Security**: Helmet, CORS, bcryptjs, express-rate-limit, Joi validation
- **Logging**: Winston
- **Testing**: Jest + Supertest + fast-check (property-based testing)

## Database

- **Primary**: PostgreSQL 15+
- **Admin Tool**: PgAdmin 4 (optional, port 5050)
- **Migrations**: SQL scripts in `database/` directory
- **Connection**: Direct queries via `pg` library

## Development Tools

- **TypeScript**: v5.3.3 with strict mode
- **Package Manager**: npm
- **Concurrency**: concurrently for running multiple services
- **Environment**: dotenv for configuration
- **Linting**: ESLint with React and TypeScript plugins

## Common Commands

### Setup & Installation
```bash
npm run setup              # Install all dependencies and verify
npm run install:all        # Install frontend and backend dependencies
npm run verify             # Verify setup and check services
```

### Development
```bash
npm run dev                # Start both frontend and backend
npm run dev:frontend       # Start frontend only (port 5173)
npm run dev:backend        # Start backend only (port 3001)
```

### Building
```bash
npm run build              # Build both frontend and backend
npm run build:frontend     # Build frontend for production
npm run build:backend      # Compile TypeScript to JavaScript
npm run build:prod         # Production build with NODE_ENV=production
```

### Testing
```bash
npm run test               # Run all tests (frontend + backend)
npm run test:frontend      # Run frontend tests
npm run test:backend       # Run backend tests
npm run test:watch         # Run tests in watch mode (cd to frontend/backend first)
npm run test:coverage      # Generate coverage reports
```

### Database
```bash
cd database && docker-compose up -d    # Start PostgreSQL container
docker ps                              # Check running containers
```

## Service URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Database**: localhost:5432
- **PgAdmin**: http://localhost:5050 (admin@example.com / admin)

## TypeScript Configuration

Both frontend and backend use strict TypeScript:
- `strict: true`
- `noImplicitAny: true`
- `strictNullChecks: true`
- Path aliases: `@/*` maps to `src/*`

## Environment Variables

Backend requires `.env` file with:
- Database connection (DATABASE_URL, DB_HOST, DB_PORT, etc.)
- JWT secrets (JWT_SECRET, JWT_REFRESH_SECRET)
- Google OAuth credentials (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
- Gemini API key (GEMINI_API_KEY)
- CORS origin (FRONTEND_URL)

See `backend/.env.example` for complete list.
