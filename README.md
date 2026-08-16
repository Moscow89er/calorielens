# CalorieLens

Monorepo для сервиса анализа блюд по фото: backend API + frontend web.

Сейчас backend поддерживает аутентификацию и полный сценарий анализа фотографии: загрузку изображения, получение результата, приватную историю и удаление. Анализатор подключается через общий контракт `DishAnalyzer`: бесплатный demo adapter работает по умолчанию, реальный vision adapter включается через env. Web пока содержит auth-сценарий; интерфейс анализа будет следующим законченным этапом.

## Цель проекта

CalorieLens — система из двух приложений:
- web-клиент (Next.js);
- API (NestJS + PostgreSQL).

API отвечает за:
- аутентификацию пользователей;
- хранение результатов анализа блюд в PostgreSQL;
- приватное хранение загруженных изображений;
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

По умолчанию используется `DISH_ANALYZER=demo`, поэтому API-ключ не требуется.

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
- Загрузить фотографию: `POST /api/analyses` (JWT, multipart field `image`)
- История пользователя: `GET /api/analyses` (JWT, cursor pagination)
- Результат анализа: `GET /api/analyses/:id` (JWT)
- Приватное изображение: `GET /api/analyses/:id/image` (JWT)
- Удалить анализ: `DELETE /api/analyses/:id` (JWT)
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
- Анализ изображений и история: `apps/api/src/modules/analysis`
- Доступ к БД (Prisma): `apps/api/src/common/prisma/prisma.service.ts`
- Модель данных: `apps/api/prisma/schema.prisma`
- Web layout: `apps/web/src/app/layout.tsx`
- Web главная страница: `apps/web/src/app/page.tsx`
- Web страницы auth: `apps/web/src/app/login/page.tsx`, `apps/web/src/app/register/page.tsx`
- Web dashboard: `apps/web/src/app/dashboard/page.tsx`

## Режимы анализа и хранение файлов

- `DISH_ANALYZER=demo` — бесплатный детерминированный adapter для локального запуска, тестов и portfolio-demo. Он позволяет проверить полный backend analysis flow без платного API-ключа, но не выполняет настоящее распознавание изображения.
- `DISH_ANALYZER=vision` — реальный анализ через OpenAI Responses API. В этом режиме требуется `VISION_API_KEY`; timeout ограничен значением `VISION_TIMEOUT_MS` (по умолчанию 15 секунд).

Изображения хранятся локально в `UPLOAD_DIR` и выдаются только через endpoint с проверкой владельца. Это сознательное ограничение portfolio-MVP: текущая версия не использует S3 или другое внешнее object storage.

## Backend-тесты

```bash
pnpm --filter @calorielens/api test
```

Unit-тесты проверяют доменную логику и оба adapter'а. HTTP integration-тесты подменяют guard фиксированным пользователем и не дублируют временный Bearer flow, который будет заменен полноценной cookie-сессией на следующем этапе.

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
