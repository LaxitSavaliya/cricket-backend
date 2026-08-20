# 🏏 Cricket Backend API

A high-performance, production-grade, and strictly typed RESTful API for live cricket scoring, match telemetry, detailed scorecards, and ball-by-ball commentary. Built with **Node.js (ESM)**, **TypeScript**, **Express 5**, **Prisma ORM (v7)**, and **PostgreSQL**.

---

## 📑 Table of Contents

- [Tech Stack & Packages](#-tech-stack--packages)
- [Project Architecture & Directory Structure](#-project-architecture--directory-structure)
- [Which File Handles What](#-which-file-handles-what)
- [Database Models & Schema](#-database-models--schema)
- [Environment Configuration](#-environment-configuration)
- [API Reference & Endpoints](#-api-reference--endpoints)
- [Scripts & Available Commands](#-scripts--available-commands)
- [Error Handling & Response Standard](#-error-handling--response-standard)
- [Security, Performance & Graceful Shutdown](#-security-performance--graceful-shutdown)

---

## 📦 Tech Stack & Packages

### Core Runtime & Framework

| Package        | Version     | Purpose                                                                          |
| :------------- | :---------- | :------------------------------------------------------------------------------- |
| **Node.js**    | `>=20.11.0` | JavaScript runtime environment (configured for native ECMAScript Modules - ESM). |
| **TypeScript** | `^6.0.3`    | Static typing, interfaces, and compile-time type safety.                         |
| **Express**    | `^5.2.1`    | Minimalist and fast web framework for routing, middlewares, and HTTP handling.   |

### Database & ORM

| Package                | Version   | Purpose                                                                                |
| :--------------------- | :-------- | :------------------------------------------------------------------------------------- |
| **Prisma**             | `^7.9.1`  | Next-generation ORM for schema definition, migrations, and type-safe query generation. |
| **@prisma/client**     | `^7.9.1`  | Auto-generated type-safe database query client.                                        |
| **@prisma/adapter-pg** | `^7.8.0`  | Driver adapter enabling Prisma to use native PostgreSQL connection pooling.            |
| **pg**                 | `^8.21.0` | Native PostgreSQL client managing the underlying connection pool.                      |

### Security, Validation & Utilities

| Package                 | Version   | Purpose                                                                                            |
| :---------------------- | :-------- | :------------------------------------------------------------------------------------------------- |
| **zod**                 | `^4.4.3`  | TypeScript-first schema declaration and runtime validation for environment variables and requests. |
| **helmet**              | `^8.2.0`  | Secures Express apps by setting various HTTP response headers and disabling fingerprinting.        |
| **cors**                | `^2.8.6`  | Configures Cross-Origin Resource Sharing with strict origin validation and credentials support.    |
| **express-rate-limit**  | `^8.5.2`  | Basic rate-limiting middleware to prevent brute-force and DDoS attacks.                            |
| **compression**         | `^1.8.1`  | Gzip compression middleware to reduce HTTP response payload sizes.                                 |
| **morgan**              | `^1.11.0` | HTTP request logger middleware for development and production telemetry.                           |
| **pino**                | `^10.3.1` | Super fast, low-overhead JSON structured logger.                                                   |
| **pino-pretty**         | `^13.1.3` | Formats Pino logs into colorized, readable output in development mode.                             |
| **dotenv**              | `^17.4.2` | Loads environment variables from `.env` files into `process.env`.                                  |
| **jsonwebtoken**        | `^9.0.3`  | JSON Web Token implementation for user session authentication.                                     |
| **cookie-parser**       | `^1.4.7`  | Parse HTTP request cookies.                                                                        |
| **google-auth-library** | `^11.0.2` | Google OAuth2 and ID token verification client.                                                    |

### Development, Testing & Code Quality

| Package                 | Version   | Purpose                                                                             |
| :---------------------- | :-------- | :---------------------------------------------------------------------------------- |
| **tsx**                 | `^4.22.4` | TypeScript Execute - runs TypeScript files directly with hot reload and watch mode. |
| **vitest**              | `^4.1.8`  | Next-generation testing framework with native ESM and TypeScript support.           |
| **supertest**           | `^7.2.2`  | High-level abstraction for testing HTTP endpoints.                                  |
| **@vitest/coverage-v8** | `^4.1.8`  | Code coverage provider using V8 native coverage instrumentation.                    |
| **eslint**              | `^10.5.0` | Linter for identifying and fixing code quality and consistency issues.              |
| **prettier**            | `^3.8.4`  | Opinionated code formatter for consistent formatting across all files.              |
| **rimraf**              | `^6.1.3`  | Cross-platform directory cleaner to wipe build directories (`dist`).                |

---

## 🏗️ Project Architecture & Directory Structure

```text
cricket-backend/
├── prisma/                          # Database schema, migrations, and seeding scripts
│   ├── migrations/                  # Historical SQL migration steps generated by Prisma
│   ├── seed-data/                   # Static and structured initial data for seeding
│   │   ├── matches.ts               # Matches seed dataset
│   │   ├── matchPlayers.ts          # Match squad and player role seed dataset
│   │   ├── options.ts               # Seed generator configuration options
│   │   ├── players.ts               # Player profiles seed dataset
│   │   ├── teams.ts                 # Teams seed dataset
│   │   └── users.ts                 # User accounts seed dataset
│   ├── seed-utils/                  # Mathematical match simulator & scorecard generator
│   │   └── generate-matchData.ts    # Simulates ball-by-ball delivery events & match stats
│   ├── clean.ts                     # Cleans/truncates all database tables in proper order
│   ├── schema.prisma                # Prisma models, relations, indexes, and enums
│   └── seed.ts                      # Transactional seeder script for the PostgreSQL database
│
├── src/                             # Source code root
│   ├── common/                      # Reusable common helpers and wrappers
│   │   ├── asyncHandler.ts          # Express asynchronous handler wrapper
│   │   ├── handlePrismaError.ts     # Maps Prisma database errors to ApiError instances
│   │   ├── sendResponse.ts          # Standard JSON API response envelope
│   │   └── validateRequest.ts       # Zod schema validation middleware for Express
│   │
│   ├── config/                      # Application configuration & singleton instances
│   │   ├── env.ts                   # Zod environment variable parsing, coercion & validation
│   │   └── prisma.ts                # Prisma Client instantiation with pg connection pool
│   │
│   ├── generated/                   # Auto-generated Prisma client types & outputs
│   │   └── prisma/                  # Generated Prisma client targeting this project
│   │
│   ├── middlewares/                 # Global Express middlewares
│   │   └── error.middleware.ts      # Global error handling and 404 Not Found middlewares
│   │
│   ├── modules/                     # Domain modules (Feature-based structure)
│   │   ├── health/                  # Health check & root API status module
│   │   │   ├── health.controller.ts # Handlers for root and /health endpoints
│   │   │   └── health.routes.ts     # Route mapping for health module
│   │   └── match/                   # Cricket Match domain module
│   │       ├── match.controller.ts  # Express controllers for match endpoints
│   │       ├── match.routes.ts      # Route definitions for match endpoints
│   │       ├── match.service.ts     # Business logic, Prisma queries, commentary & score calculations
│   │       └── match.types.ts       # TypeScript interfaces and Prisma query select shapes
│   │
│   ├── routes/                      # Route aggregation and versioning
│   │   ├── index.ts                 # Top-level router mounting health and v1 routes
│   │   └── v1.routes.ts             # API v1 router mounting all feature subroutes
│   │
│   ├── utils/                       # Shared utility classes and logging instances
│   │   ├── ApiError.ts              # Operational API error class with HTTP status helpers
│   │   └── logger.ts                # Pino logger configuration (with pretty-print in dev)
│   │
│   ├── app.test.ts                  # Comprehensive integration tests (Vitest + Supertest)
│   ├── app.ts                       # Express application configuration & middleware pipeline
│   └── server.ts                    # HTTP server entrypoint, socket tracking & graceful shutdown
│
├── .editorconfig                    # Consistent editor indentation rules
├── .env                             # Local environment variables (do NOT commit to git)
├── .env.example                     # Example environment template
├── .gitignore                       # Git ignore file list
├── .prettierignore                  # Prettier ignore list
├── .prettierrc                      # Prettier code formatting configuration
├── eslint.config.js                 # ESLint flat configuration file
├── package.json                     # NPM project manifest & scripts
├── prisma.config.ts                 # Prisma configuration file
├── tsconfig.json                    # Development TypeScript configuration
├── tsconfig.build.json              # Production TypeScript build configuration
└── vitest.config.ts                 # Vitest test runner configuration
```

---

## 🔍 Which File Handles What

### Root & Configuration Files

- **[`src/server.ts`](file:///d:/default/cricket/cricket-backend/src/server.ts)**:
  The application entrypoint. Initializes the database connection, starts the Express HTTP server on `PORT`, sets socket timeouts (`requestTimeout`, `headersTimeout`, `keepAliveTimeout`), tracks active TCP sockets, and implements graceful shutdown on `SIGINT`, `SIGTERM`, `uncaughtException`, and `unhandledRejection`.
- **[`src/app.ts`](file:///d:/default/cricket/cricket-backend/src/app.ts)**:
  Configures the Express application pipeline: applies security headers (`helmet`), sets up dynamic CORS with origin whitelisting, applies rate limiting (`express-rate-limit`), enables Gzip compression (`compression`), attaches request logging (`morgan`), parses JSON and urlencoded request bodies, mounts all API routes, and binds the 404 handler and global error handler.
- **[`src/config/env.ts`](file:///d:/default/cricket/cricket-backend/src/config/env.ts)**:
  Validates all environment variables using `Zod` schemas at boot time. Validates port ranges, payload size strings, rate limits, production CORS requirements, and timeout constraints. Terminates the process immediately (`process.exit(1)`) if variables are invalid.
- **[`src/config/prisma.ts`](file:///d:/default/cricket/cricket-backend/src/config/prisma.ts)**:
  Configures the `pg.Pool` connection pool and initializes the singleton `PrismaClient` with `@prisma/adapter-pg`. Exports database connection management functions (`connectDatabase`, `disconnectDatabase`).

### Common Utilities & Middlewares

- **[`src/common/asyncHandler.ts`](file:///d:/default/cricket/cricket-backend/src/common/asyncHandler.ts)**:
  A higher-order function that wraps asynchronous Express controllers and forwards unhandled Promise rejections directly to Express `next(error)` to prevent unhandled process crashes.
- **[`src/common/sendResponse.ts`](file:///d:/default/cricket/cricket-backend/src/common/sendResponse.ts)**:
  Standardizes all successful and custom JSON responses into a clean envelope format: `{ success: boolean, message: string, data?: T, meta?: M }`.
- **[`src/common/validateRequest.ts`](file:///d:/default/cricket/cricket-backend/src/common/validateRequest.ts)**:
  Express middleware factory that validates incoming `req.body`, `req.params`, or `req.query` against Zod schemas and returns formatted validation errors.
- **[`src/common/handlePrismaError.ts`](file:///d:/default/cricket/cricket-backend/src/common/handlePrismaError.ts)**:
  Translates Prisma-specific database errors (such as unique constraint violation `P2002`, foreign key failure `P2003`, not found `P2025`, validation errors) into user-friendly `ApiError` instances.
- **[`src/middlewares/error.middleware.ts`](file:///d:/default/cricket/cricket-backend/src/middlewares/error.middleware.ts)**:
  Contains `notFoundHandler` for unmapped route requests (404) and `globalErrorHandler` for centralized error formatting. Safely obfuscates internal error details in production while displaying rich error details and stack traces in development.
- **[`src/utils/ApiError.ts`](file:///d:/default/cricket/cricket-backend/src/utils/ApiError.ts)**:
  Custom error class inheriting from `Error`. Features status codes (400, 401, 403, 404, 409, 422, 429, 500, 503), operational flags, error details object, and static helper factories (`ApiError.badRequest()`, `ApiError.notFound()`, etc.).
- **[`src/utils/logger.ts`](file:///d:/default/cricket/cricket-backend/src/utils/logger.ts)**:
  High-performance structured logger using `pino`. Features human-readable, colorized output via `pino-pretty` in development and JSON output in production.

### Routing & Domain Modules

- **[`src/routes/index.ts`](file:///d:/default/cricket/cricket-backend/src/routes/index.ts)**:
  Top-level router that mounts the health check routes at root `/` and API routes at `/api/v1`.
- **[`src/routes/v1.routes.ts`](file:///d:/default/cricket/cricket-backend/src/routes/v1.routes.ts)**:
  Version 1 API router that mounts domain-specific route groups such as `/matches`.
- **`src/modules/health/`**:
  - **[`health.controller.ts`](file:///d:/default/cricket/cricket-backend/src/modules/health/health.controller.ts)**: Handlers for API greeting (`/`) and service health telemetry (`/health` returning uptime, timestamp, environment).
  - **[`health.routes.ts`](file:///d:/default/cricket/cricket-backend/src/modules/health/health.routes.ts)**: Maps GET `/` and GET `/health`.
- **`src/modules/match/`**:
  - **[`match.routes.ts`](file:///d:/default/cricket/cricket-backend/src/modules/match/match.routes.ts)**: Defines endpoints for listing matches, retrieving match details, squads/players, scorecards, and commentary.
  - **[`match.controller.ts`](file:///d:/default/cricket/cricket-backend/src/modules/match/match.controller.ts)**: Handles HTTP requests, extracts parameters, invokes services, and sends standardized responses.
  - **[`match.service.ts`](file:///d:/default/cricket/cricket-backend/src/modules/match/match.service.ts)**: The core business logic engine. Fetches database records using Prisma, calculates batting strike rates, bowling economies, runs per over, fall of wickets, partnerships, live crease statuses, over summaries, and ball-by-ball commentary.
  - **[`match.types.ts`](file:///d:/default/cricket/cricket-backend/src/modules/match/match.types.ts)**: TypeScript type definitions, interfaces, and Prisma select schemas for all match responses.

### Database & Seed Pipeline

- **[`prisma/schema.prisma`](file:///d:/default/cricket/cricket-backend/prisma/schema.prisma)**:
  Defines the PostgreSQL schema with 7 models (`User`, `Player`, `Team`, `Match`, `MatchPlayer`, `MatchInning`, `Ball`) and 14 enums.
- **[`prisma/clean.ts`](file:///d:/default/cricket/cricket-backend/prisma/clean.ts)**:
  Safely wipes all records from tables in reverse-dependency order inside a database transaction.
- **[`prisma/seed.ts`](file:///d:/default/cricket/cricket-backend/prisma/seed.ts)**:
  Executes database seeding. Generates match innings, ball-by-ball events, player statistics, and inserts everything in transactional batches.

---

## 🗄️ Database Models & Schema

The database uses PostgreSQL with Prisma ORM to track complete cricket matches with ball-by-ball granularity:

```mermaid
erDiagram
    User ||--o| Player : "has profile"
    Player ||--o{ MatchPlayer : "participates as"
    Team ||--o{ MatchPlayer : "fields"
    Team ||--o{ Match : "home team"
    Team ||--o{ Match : "away team"
    Team ||--o{ Match : "toss winner"
    Match ||--o{ MatchInning : "has innings"
    Match ||--o{ MatchPlayer : "has squad"
    MatchInning ||--o{ Ball : "contains deliveries"
    MatchPlayer ||--o{ Ball : "striker"
    MatchPlayer ||--o{ Ball : "non-striker"
    MatchPlayer ||--o{ Ball : "bowler"
    MatchPlayer ||--o{ Ball : "dismissed"
    MatchPlayer ||--o{ Ball : "fielder"
    MatchPlayer ||--o{ Ball : "assist-fielder"

    User {
        String id PK
        String email
        String mobile
        Boolean isEmailVerified
        Boolean isMobileVerified
    }

    Player {
        String id PK
        String userId FK
        String name
        String displayName
        String slug UK
        PlayerRole role
        BattingStyle battingStyle
        BowlingStyle bowlingStyle
    }

    Team {
        String id PK
        String teamName UK
        String logoUrl
        String slug UK
    }

    Match {
        String id PK
        String title
        String slug UK
        MatchFormat matchFormat
        MatchStatus status
        DateTime matchDate
        String venue
        String city
        String homeTeamId FK
        String awayTeamId FK
        String tossWinnerTeamId FK
        TossDecision tossDecision
    }

    MatchPlayer {
        String id PK
        String matchId FK
        String teamId FK
        String playerId FK
        Boolean isPlaying
        Boolean isCaptain
        Boolean isViceCaptain
        Boolean isWicketKeeper
        Int lineupOrder
        Int battingOrder
        Boolean didBat
        Int runsScored
        Int ballsFaced
        Int fours
        Int sixes
        Boolean isOut
        DismissalType dismissalType
        Boolean didBowl
        Int legalBallsBowled
        Int runsConceded
        Int wickets
        Int maidens
        Int catches
        Int stumpings
        Int runOuts
    }

    MatchInning {
        String id PK
        String matchId FK
        String teamId FK
        MatchInningNo inningsNo
        Int runs
        Int wickets
        Int balls
        Int maxOvers
        MatchInningStatus status
        Int target
    }

    Ball {
        String id PK
        String inningId FK
        Int deliveryNo
        Int overNo
        Int ballNo
        String strikerMatchPlayerId FK
        String nonStrikerMatchPlayerId FK
        String bowlerMatchPlayerId FK
        Boolean isLegalDelivery
        Boolean isDotBall
        Boolean isFour
        Boolean isSix
        Boolean isWide
        Boolean isNoBall
        Boolean isBye
        Boolean isLegBye
        Int batterRuns
        Int extraRuns
        Int totalRuns
        Boolean isWicket
        DismissalType dismissalType
        String dismissedMatchPlayerId FK
        String fielderMatchPlayerId FK
        String commentaryText
    }
```

---

## ⚙️ Environment Configuration

Environment variables are defined in `.env` and strictly validated at runtime by [`src/config/env.ts`](file:///d:/default/cricket/cricket-backend/src/config/env.ts).

### Environment Variables Reference

| Variable                  | Type                                    | Default                       | Description                                                                                       |
| :------------------------ | :-------------------------------------- | :---------------------------- | :------------------------------------------------------------------------------------------------ |
| `NODE_ENV`                | `development` \| `production` \| `test` | `development`                 | Node application environment.                                                                     |
| `PORT`                    | `number` (1-65535)                      | `5000`                        | Port for the HTTP server to listen on.                                                            |
| `DATABASE_URL`            | `string` (Postgres URL)                 | _None_                        | PostgreSQL connection string (`postgresql://USER:PASSWORD@HOST:PORT/DB`). Required in production. |
| `CORS_ORIGIN`             | `string` (comma-separated URLs)         | `*` (dev only)                | Allowed origins for CORS. In production, exact origins are strictly required.                     |
| `LOG_LEVEL`               | `error` \| `warn` \| `info` \| `debug`  | `debug` (dev) / `info` (prod) | Pino logger severity filter level.                                                                |
| `REQUEST_BODY_LIMIT`      | `string` (e.g., `2mb`, `500kb`)         | `2mb`                         | Maximum allowed request payload size.                                                             |
| `RATE_LIMIT_WINDOW_MS`    | `number`                                | `900000` (15 min)             | Window duration for rate limiting in milliseconds.                                                |
| `RATE_LIMIT_MAX_REQUESTS` | `number`                                | `300`                         | Maximum requests permitted per window per IP.                                                     |
| `SHUTDOWN_TIMEOUT_MS`     | `number`                                | `10000` (10s)                 | Grace period to wait for in-flight requests during server shutdown.                               |
| `REQUEST_TIMEOUT_MS`      | `number`                                | `30000` (30s)                 | Maximum duration allowed for receiving an entire request.                                         |
| `HEADERS_TIMEOUT_MS`      | `number`                                | `15000` (15s)                 | Maximum duration allowed for receiving HTTP request headers.                                      |
| `KEEP_ALIVE_TIMEOUT_MS`   | `number`                                | `5000` (5s)                   | Milliseconds of inactivity before closing keep-alive sockets.                                     |
| `TRUST_PROXY`             | `boolean`                               | `false`                       | Enable when running behind reverse proxies (Nginx, Cloudflare, AWS ALB).                          |

---

## 🌐 API Reference & Endpoints

Base URL: `http://localhost:5000`

### 1. System & Health Endpoints

| Method | Endpoint  | Description                         | Response Example                                                                                                              |
| :----- | :-------- | :---------------------------------- | :---------------------------------------------------------------------------------------------------------------------------- |
| `GET`  | `/`       | API service status greeting         | `{"success": true, "message": "Cricket backend API is running"}`                                                              |
| `GET`  | `/health` | System health, uptime & environment | `{"success": true, "message": "Service healthy", "data": {"uptime": 42.1, "timestamp": "...", "environment": "development"}}` |
| `GET`  | `/api/v1` | API v1 status greeting              | `{"success": true, "message": "Cricket API v1 is running"}`                                                                   |

### 2. Match Endpoints (`/api/v1/matches`)

| Method | Endpoint                           | Description                                                                                                 |
| :----- | :--------------------------------- | :---------------------------------------------------------------------------------------------------------- |
| `GET`  | `/api/v1/matches`                  | Get list of all matches with summary scores, formats, teams, and result status.                             |
| `GET`  | `/api/v1/matches/:slug`            | Get comprehensive match details by match slug.                                                              |
| `GET`  | `/api/v1/matches/:slug/players`    | Get squads, playing XI, and bench players for both home and away teams.                                     |
| `GET`  | `/api/v1/matches/:slug/score`      | Get full match scorecard (innings breakdown, batting card, bowling figures, partnerships, fall of wickets). |
| `GET`  | `/api/v1/matches/:slug/commentary` | Get ball-by-ball commentary, over-by-over summaries, and live match situation.                              |

---

## 🚀 Scripts & Available Commands

All project workflows can be executed using `npm run <command>`:

### Development & Server

```bash
# Start development server with tsx watch hot-reload
npm run dev

# Compile TypeScript to production output in dist/
npm run build

# Start production server from dist/server.js with source maps
npm start

# Clean build directory (dist/)
npm run clean
```

### Database & Prisma

```bash
# Format schema.prisma file
npm run prisma:format

# Validate Prisma schema
npm run prisma:validate

# Generate Prisma Client TypeScript types (outputs to src/generated/prisma)
npm run prisma:generate

# Run development database migrations
npm run db:migrate

# Deploy migrations in production/CI
npm run db:deploy

# Open interactive Prisma Studio GUI in browser (http://localhost:5555)
npm run db:studio

# Clean all records from database tables
npm run db:clean

# Seed database with players, teams, matches, and ball-by-ball data
npm run db:seed

# Reset database (clean + seed)
npm run db:reset

# All-in-one database setup (format, validate, generate, migrate)
npm run db:prepare
```

### Testing & Code Quality

```bash
# Run unit and integration tests interactively with Vitest
npm test

# Run tests once (for CI pipelines)
npm run test:run

# Run tests with code coverage report
npm run test:coverage

# Check code formatting with Prettier
npm run format:check

# Fix and format code with Prettier
npm run format:write

# Lint code with ESLint
npm run lint

# Auto-fix lint issues with ESLint
npm run lint:fix

# Run TypeScript typecheck without emitting files
npm run typecheck

# Full CI validation pipeline (format check, lint, typecheck, coverage tests, build)
npm run check
```

---

## 🛡️ Error Handling & Response Standard

### Standard Success Response Envelope

```json
{
  "success": true,
  "message": "Matches fetched successfully.",
  "data": [ ... ]
}
```

### Standard Error Response Envelope

```json
{
  "success": false,
  "message": "Match not found.",
  "errors": { ... }
}
```

### Error Types Handled

- **`ApiError`**: Operational errors with status codes (400, 401, 403, 404, 409, 422, 429, 500, 503).
- **`ZodError`**: Automatic 400 Bad Request with field-by-field validation details.
- **Malformed JSON**: Automatic 400 Bad Request if the client sends invalid JSON payload.
- **Payload Too Large**: Automatic 413 Payload Too Large if request body exceeds `REQUEST_BODY_LIMIT`.
- **Prisma Client Errors**: Automatically mapped to meaningful 400, 404, or 409 errors via `handlePrismaError`.
- **404 Not Found**: Catch-all handler for unmapped routes.

---

## 🔒 Security, Performance & Graceful Shutdown

1. **Security Protections**:
   - Helmet HTTP headers enabled with `Cross-Origin-Resource-Policy`.
   - `x-powered-by` header removed.
   - Dynamic CORS origin verification with strict production origin enforcement.
   - Rate limiting enabled to guard against abuse.

2. **Network & Connection Limits**:
   - Connection pool limits dynamically sized (`max: 10` in prod, `5` in dev).
   - Strict socket timeouts (`requestTimeout`, `headersTimeout`, `keepAliveTimeout`) to prevent Slowloris attacks.

3. **Graceful Shutdown**:
   - Listens for `SIGINT`, `SIGTERM`, `uncaughtException`, and `unhandledRejection`.
   - Immediately stops accepting new HTTP connections and destroys idle sockets (`server.closeIdleConnections()`).
   - Grants up to `SHUTDOWN_TIMEOUT_MS` (default: 10 seconds) for existing requests to complete.
   - Safely disconnects Prisma database client (`prisma.$disconnect()`).
   - Exits cleanly with appropriate status code.
