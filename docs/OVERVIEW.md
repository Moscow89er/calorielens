# Overview

Автосводка по проекту. Сгенерировано: `2026-03-23T16:58:22.525Z`.

## Workspaces
- `@calorielens/api` (`apps/api`) — scripts: predev, dev, prebuild, build, start, check, check:fix, prisma:format, prisma:generate, prisma:migrate, prisma:studio
- `@calorielens/shared` (`packages/shared`) — scripts: build

## API Modules
- `admin`
- `analysis`
- `auth`
- `health`
- `users`

## API Endpoints
| Method | Path | Module |
|---|---|---|
| `POST` | `/api/auth/login` | `auth` |
| `GET` | `/api/auth/me` | `auth` |
| `POST` | `/api/auth/register` | `auth` |
| `GET` | `/api/health` | `health` |

## Shared Exports (`packages/shared/src/index.ts`)
- `./constants/roles`
- `./types/api`
- `./types/auth`
- `./types/jwt-payload.type`

## Prisma Summary
### Models
- `User`
- `Analysis`
### Enums
- `UserRole`

## Sources
- `apps/api/src/modules/*/*.controller.ts`
- `apps/api/prisma/schema.prisma`
- `packages/shared/src/index.ts`
- `apps/*/package.json`, `packages/*/package.json`
