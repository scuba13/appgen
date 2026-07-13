# Database Standard

## Obrigatorio

- Use PostgreSQL and Prisma by default in the backend API only.
- Use versioned migrations.
- Define constraints for important invariants.
- Add indexes for frequent filters, sorting, joins, and foreign keys.
- Use transactions for atomic multi-entity operations.
- Avoid N+1 queries in listings.
- Make migrations reviewable and reversible when possible.
- Add audit fields to critical entities when applicable.
- Classify personal and sensitive data in the data model.

## Recomendado

- Define data retention strategy when personal data exists.
- Use soft delete only for business or audit requirements.
- Prefer table and column names aligned with the business domain.

## Proibido

- Change schema manually without a migration.
- Leave important invariants enforced only by application code.
- Store secrets or credentials in the database as plain text.
- Import Prisma, `@prisma/client`, database clients, or repositories from frontend code.
