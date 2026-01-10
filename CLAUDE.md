# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Development server (port 3000, proxies /api to localhost:8080)
npm run dev

# Production build (runs vue-tsc type checking before Vite build)
npm run build

# Preview production build
npm run preview

# Type checking only
npx vue-tsc -b

# Linting with auto-fix
npm run lint

# Format code with Prettier
npm run format
```

## Testing Commands

```bash
# Unit tests (Vitest with jsdom)
npm run test:unit

# Unit tests in watch mode
npx vitest

# Run single test file
npx vitest src/__tests__/stores/auth.store.spec.ts

# Unit tests with coverage
npx vitest --coverage

# E2E tests (Playwright - requires dev server)
npm run test:e2e

# E2E with specific browser
npx playwright test --project=chromium
```

## Architecture Overview

**Stack**: Vue 3 + TypeScript + Vite + PrimeVue + Tailwind CSS + Pinia

### Core Patterns

**API Layer** (`src/api/`):
- Axios client with JWT interceptors in `index.ts`
- Domain-specific API modules (auth, chat, knowledge, organization, tenant)
- Base URL configured via `VITE_API_BASE_URL` and `VITE_API_V1_STR` env vars
- Auto-redirects to /login on 401 responses

**State Management** (`src/stores/`):
- Pinia stores with Composition API syntax
- All stores use `pinia-plugin-persistedstate` for localStorage persistence
- Auth store manages JWT tokens, user data, and organization context

**Composables** (`src/composables/`) Always use composables in pages:
- `useAuth` - Auth state and actions wrapper
- `useKnowledge`, `useOrganization` - Domain-specific logic
- `usePagination`, `useSearch`, `useToast` - Reusable utilities

**Routing** (`src/router/`):
- Two layouts: `AuthLayout` (login) and `DefaultLayout` (main app with sidebar)
- Route guards check `requiresAuth` and `requiresOrg` meta flags
- Protected routes redirect to /login, org-required routes to /organizations

**Components** (`src/components/`):
- Organized by domain: analytics, chat, documents, organizations
- Uses PrimeVue components with Aura theme
- Dark mode via `.dark-mode` class selector

### Key Integrations

**PrimeVue v4**: Configured in main.ts with Aura theme, ToastService, and ConfirmationService. CSS layer order: `tailwind-base, primevue, tailwind-utilities`.

**Vue Flow**: Used for workflow visualization (`@vue-flow/core` with background, controls, minimap addons).

**Charts**: Chart.js integration via vue-chartjs for analytics/statistics pages.

### PrimeVue v4 Component Guidelines

**IMPORTANT**: This project uses PrimeVue v4.2.5. Always use MCP PrimeVue.

### Build Configuration

Vite is configured with manual chunks for optimal splitting:
- `vue-vendor`: Vue ecosystem (vue, vue-router, pinia)
- `primevue`: UI components
- `chart`: Chart.js libraries
- `vue-flow`: Flow diagram libraries
- `utils`: Utility libraries (axios, dayjs, marked, uuid)

### Path Alias

`@` maps to `./src` directory.

## Database Connection

```bash
PGPASSWORD=aynux_dev psql -h localhost -U enzo -d aynux
```

### Key Schemas & Tables

| Schema | Table | Purpose |
|--------|-------|---------|
| `core` | `company_knowledge` | Knowledge Base documents |
| `core` | `agent_knowledge` | Agent-specific knowledge |
| `excelencia` | `software_modules` | Software catalog (Excelencia) |

See `docs/knowledge-base-architecture.md` for detailed documentation.
