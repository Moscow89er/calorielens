# Project Map

Карта проекта для быстрого поиска кода.

## Пакеты и назначения

| Путь | Назначение | Критичность |
|---|---|---|
| `apps/api` | Основной backend на NestJS | High |
| `apps/api/src/main.ts` | Точка входа, глобальные middleware/pipes | High |
| `apps/api/src/app.module.ts` | Корневая композиция модулей | High |
| `apps/api/src/common` | Инфраструктурный слой (Prisma, утилиты) | High |
| `apps/api/src/modules/auth` | Аутентификация, JWT, guards/roles | High |
| `apps/api/src/modules/users` | Доступ к пользователям через Prisma | High |
| `apps/api/src/modules/health` | Healthcheck endpoint | Medium |
| `apps/api/src/modules/admin` | Каркас админ-зоны (пока без бизнес-логики) | Medium |
| `apps/api/src/modules/analysis` | Каркас анализа (пока без бизнес-логики) | Medium |
| `apps/api/prisma/schema.prisma` | Источник истины по модели БД | High |
| `apps/api/prisma/migrations` | SQL-миграции Prisma | High |
| `packages/shared` | Общие типы/константы между пакетами | High |
| `README.md` | Быстрый старт и навигация по проекту | High |
| `docs/ARCHITECTURE.md` | Архитектура и потоки данных | High |

## API карта (текущее состояние)

| Метод | Путь | Модуль | Статус |
|---|---|---|---|
| `GET` | `/api/health` | `health` | Реализован |
| `POST` | `/api/auth/register` | `auth` | Реализован |
| `POST` | `/api/auth/login` | `auth` | Реализован |
| `GET` | `/api/auth/me` | `auth` | Реализован (JWT) |
| - | `/api/admin/*` | `admin` | Каркас |
| - | `/api/analysis/*` | `analysis` | Каркас |

## Слои и зависимости

1. Controller (`modules/*/*.controller.ts`) принимает/валидирует вход.
2. Service (`modules/*/*.service.ts`) содержит бизнес-логику.
3. `UsersService` и другие сервисы работают с БД через `PrismaService`.
4. Типы ролей и JWT берутся из `packages/shared`.

## Где править типовые задачи

| Задача | Где править |
|---|---|
| Добавить endpoint | `apps/api/src/modules/<module>/<module>.controller.ts` |
| Добавить бизнес-логику | `apps/api/src/modules/<module>/<module>.service.ts` |
| Добавить таблицу/поле в БД | `apps/api/prisma/schema.prisma` + новая миграция |
| Изменить правила авторизации | `apps/api/src/modules/auth/guards` и `decorators` |
| Изменить срок/секрет JWT | `apps/api/.env` + конфиг в `auth.module.ts` |
| Добавить общий тип | `packages/shared/src/*` |

## Индексация: практические правила

- Считать источником истины по архитектуре: `docs/ARCHITECTURE.md`.
- Считать источником истины по структуре: этот файл (`docs/PROJECT_MAP.md`).
- Если добавлен новый модуль/endpoint, обновлять оба файла в том же PR.
- Если модуль пока пустой (каркас), явно отмечать это в карте (как сейчас для `admin` и `analysis`).
