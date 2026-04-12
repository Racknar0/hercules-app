# Backend Structure (Clean Scaffold)

This scaffold keeps your current code working while preparing a clean modular layout.

## Folders

- `config/`: environment and app configuration
- `database/`: Prisma client and DB helpers
- `modules/`: feature modules (routers por dominio)
- `infrastructure/`: adapters externos (AI, export)
- `shared/`: utilidades transversales (`runtime`, `validators`)

## Notes

- Las rutas ya estan separadas por dominio (`auth`, `system`, `upload`, `qa`, `records`).
- `server.js` ahora solo hace bootstrap: middlewares, static y `app.use(...)` de routers.
- `records/services/master.service.js` concentra logica de negocio/persistencia del dominio records.
- Prisma schema is in `prisma/schema.prisma`.
