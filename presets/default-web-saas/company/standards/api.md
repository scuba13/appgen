# API Standard

## Obrigatorio

- Document API contracts before implementation.
- Validate payloads, permissions, and business invariants on writes.
- Use pagination and maximum limits for listing endpoints.
- Define filters and sorting explicitly.
- Consider idempotency for critical write operations.
- Preserve compatibility or document an evolution strategy for contract changes.
- Use this error shape:

```json
{
  "error": {
    "code": "DOMAIN_ERROR_CODE",
    "message": "Safe user-facing message",
    "details": {}
  }
}
```

## Recomendado

- Use OpenAPI for REST APIs.
- Use opaque IDs in public routes.
- Separate input payloads, response DTOs, and persisted models.
- Validate DTOs with Zod or class-validator according to the chosen stack.

## Proibido

- Return stack traces to clients.
- Return sensitive data by default.
- Return persisted entities directly when they contain sensitive or internal fields.
- Create private-resource endpoints without backend authorization.
- Accept uncontrolled free-form filters.
