# shared

Reusable foundation used by all other layers.

- `api`: transport client and generic request/response helpers
- `config`: env and runtime config
- `lib`: generic utilities
- `ui`: base UI primitives

This layer must not depend on `entities`, `features`, `widgets`, or `app`.
