# Overview

Автосводка по проекту.

## Workspaces
- `@calorielens/api` (`apps/api`) — scripts: predev, dev, prebuild, build, start, check, check:fix, test, test:watch, prisma:format, prisma:generate, prisma:migrate, prisma:studio
- `@calorielens/shared` (`packages/shared`) — scripts: build
- `@calorielens/web` (`apps/web`) — scripts: dev, build, start, lint

## API Modules
- `analysis`
- `auth`
- `health`
- `users`

## API Endpoints
| Method | Path | Module |
|---|---|---|
| `GET` | `/api/analyses` | `analysis` |
| `POST` | `/api/analyses` | `analysis` |
| `DELETE` | `/api/analyses/:id` | `analysis` |
| `GET` | `/api/analyses/:id` | `analysis` |
| `GET` | `/api/analyses/:id/image` | `analysis` |
| `POST` | `/api/auth/login` | `auth` |
| `GET` | `/api/auth/me` | `auth` |
| `POST` | `/api/auth/register` | `auth` |
| `GET` | `/api/health` | `health` |

## Web Routes (Next.js App Router)
| Kind | Route |
|---|---|
| `PAGE` | `/` |
| `PAGE` | `/dashboard` |
| `PAGE` | `/login` |
| `PAGE` | `/register` |

## Shared Exports (`packages/shared/src/index.ts`)
- `./constants/analysis-source`
- `./constants/roles`
- `./types/analysis`
- `./types/api`
- `./types/auth`
- `./types/jwt-payload.type`

## Prisma Summary
### Models
- `User`
- `Analysis`
### Enums
- `UserRole`
- `AnalysisSource`

## Sources
- `apps/api/src/modules/*/*.controller.ts`
- `apps/web/src/app/**/{page.tsx,route.ts}`
- `apps/api/prisma/schema.prisma`
- `packages/shared/src/index.ts`
- `apps/*/package.json`, `packages/*/package.json`
