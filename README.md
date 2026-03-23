# CalorieLens

Monorepo для сервиса анализа блюд по фото: backend API + frontend web.

Сейчас в проекте реализованы базовые блоки платформы: API-модули `auth`, `users`, `health`, каркас для `analysis` и `admin`, базовый Next.js frontend, а также общие типы в `packages/shared`.

## Цель проекта

CalorieLens — система из двух приложений:
- web-клиент (Next.js);
- API (NestJS + PostgreSQL).

API отвечает за:
- аутентификацию пользователей;
- управление ролями доступа (`USER` / `ADMIN`);
- хранение результатов анализа блюд в PostgreSQL;
- отдачу API для клиентских приложений.

## Быстрый старт

Предусловия:
- установлен `pnpm`;
- запущен Docker;
- поднят контейнер PostgreSQL (ожидается доступ к `localhost:5432`).

1. Установить зависимости:

```bash
pnpm install
```

2. Создать env-файл API:

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

6. Запустить web:

```bash
pnpm --filter @calorielens/web dev
```

Web запускается по умолчанию на `http://localhost:3000`.

## Ключевые сценарии

- Регистрация: `POST /api/auth/register`
- Логин: `POST /api/auth/login`
- Текущий пользователь: `GET /api/auth/me` (JWT)
- Healthcheck: `GET /api/health`
- Web главная страница: `GET /`
- Web login: `GET /login`
- Web register: `GET /register`
- Web dashboard: `GET /dashboard`

## Структура репозитория

- `apps/api` — NestJS API (основная серверная логика)
- `apps/web` — Next.js frontend (App Router)
- `apps/web/src/app` — маршруты приложения (страницы App Router)
- `apps/web/src/shared` — общий слой frontend
- `apps/web/src/entities` — сущности frontend
- `apps/web/src/features` — фичи frontend
- `apps/web/src/widgets` — виджеты frontend
- `apps/api/prisma` — схема БД и миграции
- `packages/shared` — общие типы и константы для backend/frontend
- `docs/ARCHITECTURE.md` — обзор архитектуры и модулей
- `docs/PROJECT_MAP.md` — карта файлов и зон ответственности

## Где искать логику

- API точка входа: `apps/api/src/main.ts`
- Корневая сборка API-модулей: `apps/api/src/app.module.ts`
- Аутентификация и JWT: `apps/api/src/modules/auth`
- Работа с пользователями: `apps/api/src/modules/users`
- Доступ к БД (Prisma): `apps/api/src/common/prisma/prisma.service.ts`
- Модель данных: `apps/api/prisma/schema.prisma`
- Web layout: `apps/web/src/app/layout.tsx`
- Web главная страница: `apps/web/src/app/page.tsx`
- Web страницы auth: `apps/web/src/app/login/page.tsx`, `apps/web/src/app/register/page.tsx`
- Web dashboard: `apps/web/src/app/dashboard/page.tsx`

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
- web routes (Next.js App Router);
- shared-экспорты;
- Prisma models/enums.
