# CalorieLens

Короткая инструкция по локальному запуску проекта.

## Что нужно перед стартом

Перед запуском проекта нужно:

1. Запустить Docker.
2. Убедиться, что контейнер с Postgres запущен.
3. Установить зависимости проекта.
4. Сгенерировать Prisma Client.
5. Применить миграции.
6. Запустить API.

## 1. Запустить Docker и контейнер с базой данных

Сначала открой Docker Desktop.

После этого убедись, что контейнер `calorielens-postgres` находится в статусе `Running` и проброшен на порт `5432:5432`.

Это нужно для того, чтобы Prisma и API могли подключиться к локальной PostgreSQL.

## 2. Установить зависимости

Из корня проекта выполни:

```bash
pnpm install
```

Эта команда устанавливает все зависимости для monorepo.

## 3. Сгенерировать Prisma Client

Из корня проекта выполни:

```bash
pnpm --filter @calorielens/api prisma:generate
```

Эта команда генерирует Prisma Client на основе `schema.prisma`, чтобы приложение могло работать с базой данных.

## 4. Применить миграции

Из корня проекта выполни:

```bash
pnpm --filter @calorielens/api prisma:migrate
```

Эта команда применяет миграции к базе данных и создает или обновляет таблицы.

Если это первый запуск, Prisma может попросить указать имя миграции. Например:

```bash
init
```

## 5. Запустить API

Из корня проекта выполни:

```bash
pnpm --filter @calorielens/api dev
```

Эта команда запускает backend в режиме разработки с автоматическим перезапуском при изменении файлов.

## Дополнительно

### Открыть Prisma Studio

```bash
pnpm --filter @calorielens/api prisma:studio
```

Эта команда открывает Prisma Studio для просмотра и редактирования данных в базе через UI.

## Быстрый сценарий запуска

```bash
pnpm install
pnpm --filter @calorielens/api prisma:generate
pnpm --filter @calorielens/api prisma:migrate
pnpm --filter @calorielens/api dev
```

## Возможные проблемы

### Prisma не может подключиться к базе

Если появляется ошибка вида `P1001: Can't reach database server at localhost:5432`, проверь:

* запущен ли Docker Desktop;
* запущен ли контейнер `calorielens-postgres`;
* доступен ли порт `5432`.
