# Architecture

## Контекст

Проект собран как `pnpm` monorepo.

- Приложение: `apps/api` (NestJS 11)
- Общие контракты: `packages/shared`
- База данных: PostgreSQL + Prisma ORM

## Верхнеуровневая схема

1. Клиент отправляет HTTP-запрос в NestJS API.
2. `main.ts` применяет global prefix `api`, CORS и `ValidationPipe`.
3. `AppModule` поднимает функциональные модули.
4. Сервисы используют `PrismaService` для доступа к БД.
5. Для защищенных роутов работают `JwtAuthGuard` и `RolesGuard`.

## Модули API

### `AuthModule`

Файлы: `apps/api/src/modules/auth/*`

Ответственность:
- регистрация пользователя;
- логин и выдача JWT;
- получение текущего пользователя;
- role-based доступ через декоратор `@Roles(...)`.

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

### `AdminModule`

Файлы: `apps/api/src/modules/admin/*`

Статус:
- модуль подключен в `AppModule`, но бизнес-методы пока не реализованы.

### `AnalysisModule`

Файлы: `apps/api/src/modules/analysis/*`

Статус:
- модуль подключен, но пока содержит каркас.

## Общий инфраструктурный слой

### `CommonModule`

Файлы: `apps/api/src/common/*`

Ответственность:
- глобальный `PrismaService`;
- единая точка подключения к PostgreSQL;
- утилиты инфраструктуры (`role-mapper`).

## Слой shared-контрактов

Файлы: `packages/shared/src/*`

Ответственность:
- роли (`UserRole`);
- JWT payload тип (`JwtPayload`);
- auth- и api-типы для межпакетного использования.

Принцип:
- `apps/api` импортирует контракты из `@calorielens/shared`, чтобы избежать дублирования типов.

## Данные и модель БД

Файл: `apps/api/prisma/schema.prisma`

Сущности:
- `User`: email, passwordHash, role, createdAt;
- `Analysis`: ссылка на `User`, путь к изображению, название блюда, калории, confidence, createdAt.

Связи:
- `User 1:N Analysis` с каскадным удалением (`onDelete: Cascade`).

## Конфигурация и валидация env

В `AppModule` обязательны:
- `JWT_SECRET`
- `DATABASE_URL`

С дефолтами/ограничениями:
- `JWT_EXPIRES_IN` (паттерн `^\\d+(ms|s|m|h|d|w|y)$`, default `7d`)
- `BCRYPT_SALT_ROUNDS` (int 4..31, default `10`)

## Текущие API endpoints

С учетом `main.ts` (`/api` prefix):
- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` (JWT)
- `GET /api/auth/admin-only` (JWT + `ADMIN`)

## Горячие точки для изменений

- Добавление новой бизнес-функции: новый модуль в `apps/api/src/modules/*` + регистрация в `app.module.ts`.
- Расширение данных: правка `schema.prisma` + миграция + адаптация сервисов/DTO.
- Новые роли и права: `packages/shared/src/constants/roles.ts` + `RolesGuard` + проверки в контроллерах.
