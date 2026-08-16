# Architecture

## Контекст

Проект собран как `pnpm` monorepo.

- Frontend: `apps/web` (Next.js 15, App Router)
- Backend: `apps/api` (NestJS 11)
- Общие контракты: `packages/shared`
- База данных: PostgreSQL + Prisma ORM

## Верхнеуровневая схема

1. Пользователь открывает web-приложение (`apps/web`).
2. Web обращается к API (`apps/api`) по HTTP.
3. `main.ts` в API применяет global prefix `api`, CORS и `ValidationPipe`.
4. `AppModule` поднимает функциональные модули.
5. Сервисы используют `PrismaService` для доступа к PostgreSQL.
6. Защищенные endpoint'ы используют JWT guard и фильтрацию по владельцу ресурса.
7. `AnalysisService` вызывает выбранный `DishAnalyzer`, сохраняет результат в PostgreSQL, а изображение — в приватное локальное хранилище.

## Frontend (`apps/web`)

Текущее состояние:
- базовый Next.js App Router;
- корневой layout и набор базовых страниц (`/`, `/login`, `/register`, `/dashboard`);
- зачатки слоев `shared`, `entities`, `features`, `widgets`.

Ключевые файлы:
- `apps/web/src/app/layout.tsx`
- `apps/web/src/app/page.tsx`
- `apps/web/src/app/login/page.tsx`
- `apps/web/src/app/register/page.tsx`
- `apps/web/src/app/dashboard/page.tsx`
- `apps/web/src/app/globals.css`

## Backend API (`apps/api`)

### `AuthModule`

Файлы: `apps/api/src/modules/auth/*`

Ответственность:
- регистрация пользователя;
- логин и выдача JWT;
- endpoint текущего пользователя.

Ключевые зависимости:
- `UsersModule` (чтение/создание пользователя);
- `JwtModule` (подпись токена на основе env-конфига);
- `ConfigService` (`JWT_SECRET`, `JWT_EXPIRES_IN`, `BCRYPT_SALT_ROUNDS`).

### `UsersModule`

Файлы: `apps/api/src/modules/users/*`

Ответственность:
- чтение пользователя по email;
- создание пользователя;
- изоляция Prisma-запросов к сущности `User`.

### `HealthModule`

Файлы: `apps/api/src/modules/health/*`

Ответственность:
- технический healthcheck endpoint.

### `AnalysisModule`

Файлы: `apps/api/src/modules/analysis/*`

Ответственность:
- прием JPEG, PNG и WebP до 5 МБ;
- анализ изображения через общий контракт `DishAnalyzer`;
- cursor pagination истории текущего пользователя;
- приватное чтение изображения и удаление результата;
- очистка сохраненного файла, если запись в PostgreSQL завершилась ошибкой.

Адаптеры:
- `DemoDishAnalyzer` — бесплатный детерминированный режим без внешней сети;
- `VisionDishAnalyzer` — OpenAI Responses API с JSON Schema, конечным timeout и преобразованием внешних ошибок в доменные.

Provider-specific статусы, ответы и сетевые ошибки не выходят за границы `VisionDishAnalyzer`.

## Общий инфраструктурный слой API

### `CommonModule`

Файлы: `apps/api/src/common/*`

Ответственность:
- глобальный `PrismaService`;
- единая точка подключения к PostgreSQL;
- глобальный API exception filter с единым error envelope;
- утилиты инфраструктуры (`role-mapper`).

## Слой shared-контрактов

Файлы: `packages/shared/src/*`

Ответственность:
- роли (`UserRole`);
- JWT payload (`JwtPayload`);
- auth-, analysis- и api-типы для межпакетного использования.

Принцип:
- `apps/api` и `apps/web` используют контракты из `@calorielens/shared`, чтобы избежать дублирования типов.

## Данные и модель БД

Файл: `apps/api/prisma/schema.prisma`

Сущности:
- `User`: email, passwordHash, role, createdAt;
- `Analysis`: ссылка на `User`, приватный ключ и MIME-тип изображения, название блюда, калории, confidence, источник результата и createdAt.

Связи:
- `User 1:N Analysis` с каскадным удалением (`onDelete: Cascade`).

## Конфигурация и env

API (`AppModule`) валидирует:
- `JWT_SECRET`;
- `DATABASE_URL`;
- `JWT_EXPIRES_IN` (паттерн `^\\d+(ms|s|m|h|d|w|y)$`, default `7d`);
- `BCRYPT_SALT_ROUNDS` (int 4..31, default `10`).
- `DISH_ANALYZER` (`demo` или `vision`, default `demo`);
- `VISION_API_KEY` (обязателен только для `vision`);
- `VISION_API_URL`, `VISION_MODEL`, `VISION_TIMEOUT_MS`;
- `UPLOAD_DIR` для локального хранилища изображений.

## Текущие маршруты

API (с учетом префикса `/api`):
- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` (JWT)
- `POST /api/analyses` (JWT, multipart)
- `GET /api/analyses` (JWT)
- `GET /api/analyses/:id` (JWT)
- `GET /api/analyses/:id/image` (JWT)
- `DELETE /api/analyses/:id` (JWT)

Web:
- `GET /`
- `GET /login`
- `GET /register`
- `GET /dashboard`

## Горячие точки для изменений

- Новая frontend-страница: `apps/web/src/app/**/page.tsx`.
- Новая frontend-фича по слоям: `apps/web/src/features/*`, `apps/web/src/widgets/*`, `apps/web/src/entities/*`.
- Новая backend-фича: модуль в `apps/api/src/modules/*` + регистрация в `apps/api/src/app.module.ts`.
- Изменение данных: `apps/api/prisma/schema.prisma` + миграция + адаптация сервисов/DTO.
- Новые общие контракты: `packages/shared/src/*`.

## Сознательные ограничения MVP

- Локальное файловое хранилище подходит для portfolio-demo и запуска одним экземпляром API, но не предназначено для горизонтального масштабирования.
- S3 и другие внешние object storage не добавляются в scope проекта.
- Demo adapter демонстрирует pipeline, а не настоящее распознавание изображения; источник результата сохраняется и возвращается API.
