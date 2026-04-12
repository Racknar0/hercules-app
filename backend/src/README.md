# Backend Structure (Clean Scaffold)

This scaffold keeps your current code working while preparing a clean modular layout.

## Folders

- `config/`: environment and app configuration
- `database/`: Prisma client and DB helpers
- `modules/`: feature modules (auth, organizations, cases, documents, etc.)
- `shared/`: reusable middlewares, validators, constants, errors, utilities
- `jobs/`: background job handlers
- `infrastructure/`: integrations (storage, AI, queues, external services)
- `services/`: legacy services currently used by `server.js`

## Notes

- No routes/controllers were added yet.
- Existing flow remains untouched.
- Prisma schema is in `prisma/schema.prisma`.
