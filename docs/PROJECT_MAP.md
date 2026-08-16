# Project Map

Карта проекта для быстрого поиска кода.

## Пакеты и назначения

| Путь | Назначение | Критичность |
|---|---|---|
| `apps/api` | Backend на NestJS | High |
| `apps/web` | Frontend на Next.js (App Router) | High |
| `apps/web/src/app` | Роуты и страницы frontend (App Router) | High |
| `apps/web/src/shared` | Общий слой frontend | Medium |
| `apps/web/src/entities` | Слой сущностей frontend | Medium |
| `apps/web/src/features` | Слой фич frontend | Medium |
| `apps/web/src/widgets` | Слой виджетов frontend | Medium |
| `apps/api/src/main.ts` | Точка входа API, глобальные middleware/pipes | High |
| `apps/api/src/app.module.ts` | Корневая композиция API-модулей | High |
| `apps/api/src/common` | Инфраструктурный слой API (Prisma, утилиты) | High |
| `apps/api/src/modules/auth` | Аутентификация, JWT | High |
| `apps/api/src/modules/users` | Доступ к пользователям через Prisma | High |
| `apps/api/src/modules/health` | Healthcheck endpoint | Medium |
| `apps/api/src/modules/analysis` | Анализ изображений, история, adapters и приватное файловое хранилище | High |
| `apps/web/src/app/layout.tsx` | Корневой layout frontend | High |
| `apps/web/src/app/page.tsx` | Главная страница frontend | High |
| `apps/web/src/app/login/page.tsx` | Страница логина frontend | High |
| `apps/web/src/app/register/page.tsx` | Страница регистрации frontend | High |
| `apps/web/src/app/dashboard/page.tsx` | Страница dashboard frontend | High |
| `apps/api/prisma/schema.prisma` | Источник истины по модели БД | High |
| `apps/api/prisma/migrations` | SQL-миграции Prisma | High |
| `packages/shared` | Общие типы/константы между пакетами | High |
| `README.md` | Быстрый старт и навигация по проекту | High |
| `docs/ARCHITECTURE.md` | Архитектура и потоки данных | High |
| `docs/OVERVIEW.md` | Автогенерируемая сводка структуры | High |

## API карта (текущее состояние)

| Метод | Путь | Модуль | Статус |
|---|---|---|---|
| `GET` | `/api/health` | `health` | Реализован |
| `POST` | `/api/auth/register` | `auth` | Реализован |
| `POST` | `/api/auth/login` | `auth` | Реализован |
| `GET` | `/api/auth/me` | `auth` | Реализован (JWT) |
| `POST` | `/api/analyses` | `analysis` | Реализован (JWT, multipart) |
| `GET` | `/api/analyses` | `analysis` | Реализован (JWT, cursor pagination) |
| `GET` | `/api/analyses/:id` | `analysis` | Реализован (JWT, owner-only) |
| `GET` | `/api/analyses/:id/image` | `analysis` | Реализован (JWT, owner-only) |
| `DELETE` | `/api/analyses/:id` | `analysis` | Реализован (JWT, owner-only) |

## Web карта (текущее состояние)

| Тип | Путь | Статус |
|---|---|---|
| `PAGE` | `/` | Реализован |
| `PAGE` | `/login` | Реализован |
| `PAGE` | `/register` | Реализован |
| `PAGE` | `/dashboard` | Реализован |

## Слои и зависимости

1. Web (`apps/web`) отвечает за UI и клиентские роуты.
2. API (`apps/api`) отвечает за бизнес-логику, auth и доступ к данным.
3. Сервисы API работают с БД через `PrismaService`.
4. Общие контракты и роли лежат в `packages/shared`.

## Где править типовые задачи

| Задача | Где править |
|---|---|
| Добавить web-страницу | `apps/web/src/app/<route>/page.tsx` |
| Добавить endpoint API | `apps/api/src/modules/<module>/<module>.controller.ts` |
| Добавить backend-логику | `apps/api/src/modules/<module>/<module>.service.ts` |
| Добавить таблицу/поле в БД | `apps/api/prisma/schema.prisma` + новая миграция |
| Изменить правила JWT/API-auth | `apps/api/src/modules/auth/*` |
| Добавить общий тип | `packages/shared/src/*` |

## Индексация: практические правила

- Источник истины по архитектуре: `docs/ARCHITECTURE.md`.
- Источник истины по структуре: `docs/PROJECT_MAP.md`.
- Автосводка: `docs/OVERVIEW.md` (обновляется командой `pnpm overview`).
- При изменении структуры/маршрутов обновлять helper-файлы в том же PR.
