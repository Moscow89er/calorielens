# CalorieLens

Backend-monorepo для сервиса анализа блюд по фото.

Сейчас в проекте реализованы базовые блоки платформы: `auth`, `users`, `health`, каркас для `analysis` и `admin`, общие типы в `packages/shared`.

## Цель проекта

CalorieLens — API-сервис, который:
- аутентифицирует пользователей;
- управляет ролями доступа (`USER` / `ADMIN`);
- хранит результаты анализа блюд в PostgreSQL;
- отдает API для клиентских приложений.

## Быстрый старт

Предусловия:
- установлен `pnpm`;
- запущен Docker;
- поднят контейнер PostgreSQL (ожидается доступ к `localhost:5432`).

1. Установить зависимости:

```bash
pnpm install
```

2. Создать env-файл:

```bash
cp apps/api/.env.example apps/api/.env
```

3. Сгенерировать Prisma Client:

```bash
pnpm --filter @calorielens/api prisma:generate
```

4. Применить миграции:

```bash
pnpm --filter @calorielens/api prisma:migrate
```

5. Запустить API:

```bash
pnpm --filter @calorielens/api dev
```

API запускается по умолчанию на `http://localhost:3001` с глобальным префиксом `api` (`http://localhost:3001/api/...`).

## Ключевые сценарии

- Регистрация: `POST /api/auth/register`
- Логин: `POST /api/auth/login`
- Текущий пользователь: `GET /api/auth/me` (JWT)
- Проверка роли ADMIN: `GET /api/auth/admin-only` (JWT + роль `ADMIN`)
- Healthcheck: `GET /api/health`

## Структура репозитория

- `apps/api` — NestJS API (основная серверная логика)
- `apps/api/prisma` — схема БД и миграции
- `packages/shared` — общие типы и константы для backend/frontend
- `docs/ARCHITECTURE.md` — обзор архитектуры и модулей
- `docs/PROJECT_MAP.md` — карта файлов и зон ответственности

## Где искать логику

- Точка входа приложения: `apps/api/src/main.ts`
- Корневая сборка модулей: `apps/api/src/app.module.ts`
- Аутентификация и JWT: `apps/api/src/modules/auth`
- Работа с пользователями: `apps/api/src/modules/users`
- Доступ к БД (Prisma): `apps/api/src/common/prisma/prisma.service.ts`
- Модель данных: `apps/api/prisma/schema.prisma`

## Документация для индексации

- Архитектура: `docs/ARCHITECTURE.md`
- Карта проекта: `docs/PROJECT_MAP.md`
- Автосводка (генерируется): `docs/OVERVIEW.md`

## Быстрая автосводка проекта

```bash
pnpm overview
```

Команда обновляет `docs/OVERVIEW.md` на основе текущего состояния кода:
- workspace-пакеты;
- модули и endpoints API;
- shared-экспорты;
- Prisma models/enums.
