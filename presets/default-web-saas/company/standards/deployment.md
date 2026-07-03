# Deployment Standard

## Obrigatorio

- Keep deploy configuration separate from source defaults.
- Use environment variables for environment-specific values.
- Validate required environment variables at application startup.
- Document migration strategy and rollback considerations.
- Do not overwrite existing app roots during scaffold unless explicitly approved.

## Recomendado

- Use separate environments for development, staging, and production.
- Prefer reversible migrations when possible.
- Keep infrastructure changes auditable.

## Proibido

- Store production credentials in generated source files.
- Depend on manual database changes outside migration history.
