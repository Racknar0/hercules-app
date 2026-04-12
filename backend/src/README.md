# Backend Structure (Clean Scaffold)

This scaffold keeps your current code working while preparing a clean modular layout.

## Folders

- `config/`: environment and app configuration
- `database/`: Prisma client and DB helpers
- `modules/`: feature modules (routers por dominio)
- `shared/`: reusable middlewares, validators, constants, errors, utilities
- `jobs/`: background job handlers
- `infrastructure/`: integrations (storage, AI, queues, external services)
- `services/`: logica de aplicacion y acceso a datos (persistencia DB-first)
- `shared/runtime/`: estado y helpers de runtime (cache temporal, cancelacion, mime)

## Notes

- Las rutas ya estan separadas por dominio (`auth`, `system`, `upload`, `qa`, `records`).
- `server.js` ahora solo hace bootstrap: middlewares, static y `app.use(...)` de routers.
- Prisma schema is in `prisma/schema.prisma`.
