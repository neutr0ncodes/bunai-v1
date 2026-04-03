# FitMe Project Snapshot

## Overview

FitMe is structured as a monorepo with explicit shared package boundaries so the web app does not own domain or persistence code that a future mobile app would also need.

The current product flow is:

1. users complete a styling profile in the web app
2. the app sends the profile to a local API route
3. the route calls shared domain services in `@repo/api`
4. the domain layer uses a shared persistence boundary in `@repo/db`
5. recommendations are returned as shared DTOs from `@repo/types`

This keeps the UI thin and makes it practical to add `apps/mobile` later without moving core logic again.

## Monorepo Structure

```text
bunai-v1/
├── apps/
│   └── web/               # Next.js app and route handlers
├── packages/
│   ├── api/               # Server-side orchestration and provider calls
│   ├── db/                # Shared repository/persistence contracts
│   ├── types/             # Shared request/response contracts
│   ├── ui/                # Shared presentational components
│   ├── utils/             # Shared helpers such as env utilities
│   ├── eslint-config/
│   └── typescript-config/
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

## Package Responsibilities

### `apps/web`

- owns pages, route handlers, and browser interactions
- should stay thin
- imports shared DTOs from `@repo/types`
- imports orchestration from `@repo/api`
- imports persistence factories from `@repo/db`

### `packages/api`

- owns provider orchestration and server-side business logic
- currently contains recommendation generation via Gemini
- is the correct place for logic that both web and mobile backends should share

### `packages/db`

- owns repository interfaces and persistence wiring
- is intentionally separate from the web app so future mobile server endpoints can reuse the same data access layer
- currently ships a no-op recommendation repository that can later be replaced with Supabase, Postgres, or another backing store without changing the UI contract

### `packages/types`

- owns DTO-style contracts shared across clients and server code
- keeps request and response payloads stable across app boundaries

### `packages/utils`

- owns low-level shared helpers
- currently contains environment validation helpers used by the domain layer

## Runtime Architecture

### 1. Client/UI Layer

The web UI owns rendering, local interaction state, and API calls only.

### 2. App Route Layer

`apps/web/app/api/*` acts as the transport boundary. Route handlers should:

- validate and authenticate requests
- call `@repo/api`
- wire a repository implementation from `@repo/db`
- return shared DTOs

### 3. Domain Layer

`@repo/api` owns business logic and external provider integration. This is the layer a future mobile backend or worker should reuse directly.

### 4. Persistence Layer

`@repo/db` is the shared database boundary. The current implementation is intentionally minimal, but the architectural seam is in place for a real database-backed repository.

## Mobile Reuse Path

When you add `apps/mobile`, the intended reuse model is:

1. keep the mobile UI inside `apps/mobile`
2. reuse `@repo/types` for payload contracts
3. reuse `@repo/api` in server routes, edge functions, or a separate backend
4. reuse `@repo/db` for shared persistence logic

That means the mobile app should not need to copy recommendation logic or data contracts out of the web app.

## Current Constraint

`@repo/db` currently provides a no-op repository instead of a real database adapter. That is deliberate scaffolding: the shared boundary now exists, but you still need to plug in Supabase or another database when you are ready to persist cross-platform data.
