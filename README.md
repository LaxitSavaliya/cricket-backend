# Cricket Backend

Backend API for a cricket score application built with Node.js, TypeScript, and Express.js.

## Current Features

- **TypeScript Express Backend**: Native ESM setup with strict TypeScript configuration.
- **Server Setup**: Server startup configuration, port in-use detection, and standard timeouts (request, keep-alive, headers).
- **Environment Validation**: Strict runtime checking of environment variables using `Zod` to prevent misconfigured deployments.
- **Security Middleware**: Configured with `helmet` for secure headers and disabled `x-powered-by` to prevent server fingerprinting.
- **CORS Setup**: Flexible CORS setup supporting comma-separated origins, with a strict mode that forbids wildcards in production.
- **Rate Limiting**: Configured `express-rate-limit` to reduce abuse and excessive requests.
- **Compression**: Gzip compression via `compression` for improved data transfer speeds.
- **Central Error Handling**: Customized error handling with a custom `ApiError` class and a global error middleware.
- **404 Handler**: Clean route fallback returning JSON structure for nonexistent routes.
- **Graceful Shutdown**: Handles process signals (`SIGINT`, `SIGTERM`) to close open HTTP sockets before exiting.
- **Structured Logging**: Structured JSON logging via `pino` (pretty-printing in development, JSON output in production).
- **Basic Route Tests**: Automated API validation suite testing core paths.
- **CI Workflow**: Preconfigured GitHub Actions pipeline.

## Project Structure

```text
cricket-backend/
├── .github/
│   └── workflows/
│       └── ci.yml             # GitHub Actions CI workflow configuration
├── src/
│   ├── config/
│   │   └── env.ts             # Zod environment variable validation
│   ├── middlewares/
│   │   └── error.middleware.ts # 404 and global error handlers
│   ├── utils/
│   │   ├── ApiError.ts        # Custom operational API error class
│   │   └── logger.ts          # Structured Pino logger utility
│   ├── app.test.ts            # Integration tests using Vitest & Supertest
│   ├── app.ts                 # Express Application instance setup
│   └── server.ts              # HTTP server listener and graceful shutdown setup
├── .env                       # Local environment variables (git ignored)
├── .env.example               # Example environment variables (committed)
├── .gitignore                 # Files/folders to ignore in Git
├── .prettierignore            # Files to ignore during Prettier formatting
├── .prettierrc                # Prettier code style settings
├── eslint.config.js           # ESLint flat config file
├── package.json               # Node.js project manifest, scripts, and dependencies
├── package-lock.json          # Locked dependency versions for reproducible installs
├── tsconfig.json              # Development TypeScript configuration
├── tsconfig.build.json        # Production TypeScript compilation configuration
└── vitest.config.ts           # Vitest test runner configuration
```

## Prerequisites

- **Node.js** >= `20.11.0`
- **npm** (Node Package Manager)

## Installation

Install project dependencies:

```bash
npm install
```

## Environment Variables

The project uses Zod to validate variables on startup.

1. Copy the example configuration to create a `.env` file:

   **Windows PowerShell:**

   ```powershell
   Copy-Item .env.example .env
   ```

   **macOS / Linux / Git Bash:**

   ```bash
   cp .env.example .env
   ```

2. Adjust the values inside `.env` to match your local setup.

> [!WARNING]
> `.env` contains sensitive keys and local secrets. **Never commit the `.env` file to GitHub.** Only the generic `.env.example` should be tracked in the repository.

### Example Variables

```ini
NODE_ENV=development
PORT=5000
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=debug
REQUEST_BODY_LIMIT=2mb
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=300
SHUTDOWN_TIMEOUT_MS=10000
REQUEST_TIMEOUT_MS=30000
HEADERS_TIMEOUT_MS=15000
KEEP_ALIVE_TIMEOUT_MS=5000
TRUST_PROXY=false
```

## Available Scripts

Run these scripts using `npm run <script-name>`:

- `npm run dev`: Runs the backend in development watch mode using `tsx`.
- `npm run build`: Cleans build output and compiles TypeScript source code to JS inside `dist/` (excludes test files).
- `npm start`: Starts the compiled server from `dist/server.js` with source maps enabled.
- `npm run typecheck`: Validates TypeScript types across all source code without generating outputs.
- `npm run lint`: Scans the code for quality patterns and format violations using ESLint.
- `npm run lint:fix`: Automatically fixes linting issues where possible.
- `npm run format:check`: Validates that files match Prettier code style guidelines.
- `npm run format:write`: Formats all source files with Prettier.
- `npm run test`: Starts the Vitest test runner in watch mode.
- `npm run test:run`: Runs Vitest once to completion (useful for CI/CD).
- `npm run test:coverage`: Runs Vitest and generates code coverage statistics.

## Local Verification Checklist

Run these commands from the backend root folder where `package.json` exists.

### 1. Check Node.js and npm

```bash
node -v
npm -v
```

Node.js must be `v20.11.0` or higher.

### 2. Install dependencies

```bash
npm install
```

### 3. Check formatting

```bash
npm run format:check
```

If formatting fails, fix it and check again:

```bash
npm run format:write
npm run format:check
```

### 4. Run linting

```bash
npm run lint
```

If auto-fixable lint issues exist:

```bash
npm run lint:fix
npm run lint
```

### 5. Check TypeScript

```bash
npm run typecheck
```

TypeScript errors should be fixed before moving forward.

### 6. Run tests

```bash
npm run test:run
```

Optional coverage report:

```bash
npm run test:coverage
```

Coverage output is generated inside `coverage/` and is ignored by Git.

### 7. Build the project

```bash
npm run build
```

This creates the compiled output inside `dist/`.

### 8. Start the compiled server

```bash
npm start
```

The server should start on the configured port, usually:

```text
http://localhost:5000
```

### 9. Test routes manually

In another terminal:

```bash
curl http://localhost:5000/
curl http://localhost:5000/health
curl http://localhost:5000/unknown
```

On Windows PowerShell, use `curl.exe` for cleaner output:

```powershell
curl.exe http://localhost:5000/
curl.exe http://localhost:5000/health
curl.exe http://localhost:5000/unknown
```

Expected unknown route response:

```json
{
  "success": false,
  "message": "Route GET /unknown not found"
}
```

Stop the server with:

```text
Ctrl + C
```

## API Endpoints

- **`GET /`**
  - **Description**: Verifies if the backend API server is online.
  - **Response**: `200 OK`
    ```json
    {
      "success": true,
      "message": "Cricket backend API is running"
    }
    ```
- **`GET /health`**
  - **Description**: Exposes service health statistics (uptime, environment details, timestamp).
  - **Response**: `200 OK`
    ```json
    {
      "success": true,
      "message": "Service healthy",
      "data": {
        "uptime": 12.34,
        "timestamp": "2026-06-13T14:12:12.000Z",
        "environment": "development"
      }
    }
    ```
- **Unknown Route Fallback**
  - **Description**: Fallback handler returning JSON structure for nonexistent routes.
  - **Response**: `404 Not Found`
    ```json
    {
      "success": false,
      "message": "Route GET /unknown-route not found"
    }
    ```

## Testing

Integration tests are configured using `Vitest` and `Supertest`.

- **Run all tests**:
  ```bash
  npm run test:run
  ```
- **Check test coverage**:
  ```bash
  npm run test:coverage
  ```

> [!NOTE]
> Coverage reports are generated in the local `coverage/` folder which is ignored by Git and will not be pushed to your repository.

## Code Quality

To maintain a clean codebase, always verify these checks before pushing code:

```bash
# Verify formatting
npm run format:check

# Run static analysis
npm run lint

# Verify type safety
npm run typecheck
```

## GitHub / CI

A GitHub Actions workflow is defined in `.github/workflows/ci.yml`. On every `push` or `pull_request` targeting the main branches, the CI runner automatically executes:

1. Dependency Installation (`npm ci`)
2. Formatting Check (`npm run format:check`)
3. Linting (`npm run lint`)
4. TypeScript Verification (`npm run typecheck`)
5. Automated Tests (`npm run test:run`)
6. Production Build (`npm run build`)

## Git Ignore Notes

The following files/folders must remain ignored and not committed to GitHub:

- `node_modules/` (dependency directories)
- `dist/` (compiled build output)
- `coverage/` (test coverage statistics)
- `.env` (environment configurations/secrets)
- `*.log` (runtime log files)

Make sure that **`.env.example`** is committed so other developers know what variables are required to run the project.

## Next Planned Steps

- Move root controllers (`/` and `/health`) into a dedicated routing/controller structure.
- Add PostgreSQL connection setup later.
- Define database models and schema later.
- Implement modules for match tracking, team management, and live score updates later.
