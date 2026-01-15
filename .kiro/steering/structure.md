# Project Structure

## Root Directory

```
student-discipline-system/
├── frontend/              # React frontend application
├── backend/               # Express backend API
├── database/              # Database configuration and migrations
├── .kiro/                 # Kiro specifications and steering
├── node_modules/          # Root dependencies
├── package.json           # Root package with workspace scripts
├── docker-compose.yml     # Full stack Docker configuration
├── setup.sh / setup.bat   # Platform-specific setup scripts
└── verify-setup.js        # Setup verification script
```

## Frontend Structure (`frontend/`)

```
frontend/
├── src/
│   ├── components/        # React components (UI, features)
│   ├── services/          # API service layer (HTTP clients)
│   ├── types/             # TypeScript type definitions
│   ├── hooks/             # Custom React hooks
│   ├── contexts/          # React Context providers
│   ├── utils/             # Utility functions (apiConfig, storage)
│   ├── __tests__/         # Test files (*.test.tsx, integration/)
│   ├── App.tsx            # Root application component
│   ├── main.tsx           # Application entry point
│   └── index.css          # Global styles (Tailwind imports)
├── public/                # Static assets
├── dist/                  # Build output (generated)
├── package.json           # Frontend dependencies
├── vite.config.js         # Vite configuration
├── tailwind.config.js     # Tailwind CSS configuration
├── tsconfig.json          # TypeScript configuration
└── jest.config.cjs        # Jest test configuration
```

## Backend Structure (`backend/`)

```
backend/
├── src/
│   ├── controllers/       # Route handlers (business logic entry)
│   ├── services/          # Business logic layer
│   ├── routes/            # Express route definitions
│   ├── middleware/        # Express middleware (auth, validation)
│   ├── config/            # Configuration (database, security, production)
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions (jwt, logger, password)
│   ├── scripts/           # Utility scripts (validateEnvironment)
│   ├── __tests__/         # Test files (*.test.ts, integration/)
│   └── index.ts           # Application entry point
├── dist/                  # Compiled JavaScript (generated)
├── logs/                  # Winston log files
├── .env                   # Environment variables (not in git)
├── .env.example           # Environment template
├── .env.production        # Production environment config
├── package.json           # Backend dependencies
├── tsconfig.json          # TypeScript configuration
└── jest.config.js         # Jest test configuration
```

## Database Structure (`database/`)

```
database/
├── init.sql               # Initial database schema
├── *_migration.sql        # Feature-specific migrations
├── docker-compose.yml     # PostgreSQL + PgAdmin containers
└── fix_*.sql              # Database fixes and patches
```

## Architecture Patterns

### Frontend Patterns

- **Component Organization**: Feature-based components in flat structure
- **Service Layer**: Separate service files for each API domain (authService, habitService, etc.)
- **Type Safety**: Shared types between services and components
- **State Management**: Context API for global state, local state for component-specific
- **API Communication**: Centralized baseService with token refresh logic

### Backend Patterns

- **Layered Architecture**: Routes → Controllers → Services → Database
- **Route Structure**: One route file per feature domain
- **Controller Responsibility**: Request/response handling, validation, error handling
- **Service Responsibility**: Business logic, database queries, data transformation
- **Database Access**: Raw SQL queries via `pg` library, no ORM
- **Error Handling**: Centralized error middleware, Winston logging

### Database Patterns

- **Schema**: UUID primary keys, foreign key constraints
- **Timestamps**: `created_at` and `updated_at` on all tables
- **Indexes**: Performance indexes on foreign keys and query columns
- **Migrations**: Sequential SQL files with descriptive names

## File Naming Conventions

- **Components**: PascalCase (e.g., `HabitTracker.tsx`)
- **Services**: camelCase with Service suffix (e.g., `habitService.ts`)
- **Types**: camelCase (e.g., `habit.ts`)
- **Controllers**: camelCase with Controller suffix (e.g., `habitController.ts`)
- **Routes**: camelCase with Routes suffix (e.g., `habitRoutes.ts`)
- **Tests**: Match source file with `.test.ts` or `.test.tsx` suffix
- **Integration Tests**: In `__tests__/integration/` subdirectory

## Import Patterns

- Use path alias `@/*` for imports from `src/`
- Services import from config and utils
- Controllers import from services and middleware
- Components import from services, hooks, and contexts
- Avoid circular dependencies

## Testing Structure

- **Unit Tests**: Alongside source files or in `__tests__/`
- **Integration Tests**: In `__tests__/integration/` subdirectories
- **Property-Based Tests**: Files ending with `.properties.test.ts`
- **Test Setup**: `src/test/setup.ts` for test environment configuration

## Key Directories to Know

- `.kiro/specs/`: Feature specifications and design documents
- `backend/logs/`: Application logs (combined.log, error.log)
- `frontend/dist/`: Production build output
- `backend/dist/`: Compiled TypeScript output
- Test files with `debug-*` or `test-*` prefix: Development/debugging scripts
