# Agentic Coding Guidelines

This repository contains a Vue 3 + TypeScript application using PrimeVue and Tailwind CSS.
These guidelines are intended for AI agents and human developers to ensure consistency and quality.

## 🛠 Project Commands

### Build & Development

- **Start Dev Server**: `npm run dev` (Runs on port 3000, proxies /api to localhost:8080)
- **Production Build**: `npm run build` (Runs `vue-tsc` type check first)
- **Preview Build**: `npm run preview`
- **Type Check**: `npx vue-tsc -b`

### Linting & Formatting

- **Lint Code**: `npm run lint` (ESLint with auto-fix)
- **Format Code**: `npm run format` (Prettier)
- **Rules**:
  - No semicolons
  - Single quotes for strings
  - Trailing commas in multi-line objects/arrays
  - 2 spaces indentation

### Testing

- **Run Unit Tests**: `npm run test:unit` (Vitest)
- **Run Single Unit Test**: `npx vitest src/__tests__/path/to/test.spec.ts`
- **Run E2E Tests**: `npm run test:e2e` (Playwright)
- **Test Coverage**: `npx vitest --coverage`

## 📐 Code Style & Conventions

### Core Stack

- **Framework**: Vue 3 (Composition API)
- **Language**: TypeScript
- **UI Library**: PrimeVue v4 (Aura Theme)
- **Styling**: Tailwind CSS (Utility classes) + PrimeVue custom presets
- **State Management**: Pinia (with persistence)
- **Router**: Vue Router

### Component Guidelines

- **Structure**: Use `<script setup lang="ts">`.
- **Naming**: PascalCase for filenames and component names (e.g., `UserProfile.vue`).
- **Props/Emits**: Use `defineProps<{T}>()` and `defineEmits<{T}>()` with TypeScript interfaces.
- **PrimeVue**: Use PrimeVue components extensively. Do not build custom UI components if a PrimeVue equivalent exists.
  - **Styles**: Use `tailwind-base, primevue, tailwind-utilities` layer order.
  - **Icons**: Use `pi pi-*` classes (PrimeIcons).

### State Management (Pinia)

- **Location**: `src/stores/`
- **Pattern**: Use Composition API syntax for stores (`defineStore('id', () => { ... })`).
- **Persistence**: All stores generally use `pinia-plugin-persistedstate`.
- **Usage**: Encapsulate logic in stores; components should trigger actions and read state.

### Composables

- **Location**: `src/composables/`
- **Naming**: `use[Feature]` (e.g., `useAuth`, `useOrganization`).
- **Purpose**: logic reuse, API wrappers, and complex state manipulation that spans components.
- **Rule**: Always prefer creating a composable over duplicating logic in components.

### API & Data Fetching

- **Location**: `src/api/`
- **Client**: Axios configured in `src/api/index.ts` with JWT interceptors.
- **Environment**: Base URL via `VITE_API_BASE_URL`.
- **Error Handling**: 401 Unauthorized automatically redirects to `/login`.

### Imports

- **Alias**: Use `@/` for `src/` (e.g., `import { useAuth } from '@/composables/useAuth'`).
- **Explicit Extensions**: Not strictly required for `.ts` but often helpful for clarity; `.vue` extension is mandatory.

## 📂 Project Structure

```
src/
├── api/            # API clients (axios)
├── assets/         # Static assets & global CSS
├── components/     # Vue components (Feature/Domain organized)
├── composables/    # Shared logic (use*)
├── layouts/        # App layouts (AuthLayout, DefaultLayout)
├── pages/          # Route views
├── router/         # Vue Router config & guards
├── stores/         # Pinia stores
└── types/          # TypeScript interfaces/types
```

## 📝 Rules & Best Practices

1.  **Type Safety**: Avoid `any`. Define interfaces in `src/types/` or co-located if specific to a component.
2.  **Tailwind vs CSS**: Use Tailwind utility classes for layout and spacing. Use `index.css` or `<style>` blocks only for complex, custom animations or overrides that Tailwind can't handle cleanly.
3.  **Refactoring**: When modifying existing code, respect the existing patterns. If you see a `useSomething` composable, use it instead of rewriting the logic.
4.  **Async/Await**: Prefer `async/await` over `.then()/.catch()` chains.
5.  **Environment Variables**: Access via `import.meta.env`.

## 🤖 AI Agent specific instructions

- **Context**: When asked to implement a feature, check for existing stores or composables first.
- **Files**: Do not create new files in root unless explicitly asked. Stick to the `src` structure.
- **Testing**: If modifying logic, run related tests to ensure no regressions.
