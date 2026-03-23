# Frontend Architecture (MVP)

This project uses an FSD-like structure with clear layer responsibilities.

## Layers

- `app`: routes, layouts, global providers, page composition.
- `shared`: reusable infrastructure and primitives.
- `entities`: domain entities (user, analysis).
- `features`: user scenarios (auth, upload-analysis).
- `widgets`: page-level composed blocks.

## Dependency Direction

Allowed imports go top-down:

- `app` -> `widgets`, `features`, `entities`, `shared`
- `widgets` -> `features`, `entities`, `shared`
- `features` -> `entities`, `shared`
- `entities` -> `shared`
- `shared` -> only `shared`

## Rules

- Do not place business logic in route files (`app/**/page.tsx`).
- Keep transport primitives in `shared/api`; scenario-specific calls stay in features.
- Keep domain types/models in entities, not in pages.
- Shared layer must not import from higher layers.
