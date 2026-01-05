.PHONY: dev build preview test lint format typecheck clean install

# Development server with hot reload (port 3000, proxies /api to localhost:8080)
dev:
	npm run dev

# Production build (vue-tsc + vite build)
build:
	npm run build

# Preview production build
preview:
	npm run preview

# Unit tests (Vitest)
test:
	npm run test:unit

# Unit tests in watch mode
test-watch:
	npx vitest

# E2E tests (Playwright)
test-e2e:
	npm run test:e2e

# Linting with auto-fix
lint:
	npm run lint

# Format code with Prettier
format:
	npm run format

# Type checking only
typecheck:
	npx vue-tsc -b

# Full quality check (format + lint + typecheck)
check: format lint typecheck

# Install dependencies
install:
	npm install

# Clean build artifacts
clean:
	rm -rf dist node_modules/.vite
