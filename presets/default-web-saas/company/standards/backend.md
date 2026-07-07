# Backend Standard

## Obrigatorio

- Use TypeScript and NestJS for the default API.
- Keep controllers thin; business rules belong in services, use cases, or the application layer.
- Keep domain rules independent from HTTP, framework, ORM, database, and transport details.
- Validate every external input before it reaches the domain.
- Enforce authorization on the backend for every private operation.
- Return stable domain error codes with safe user messages.
- Define idempotency for critical write operations that can be retried.
- Give external integrations timeouts, failure handling, and bounded retry when applicable.
- Declare every runtime or type dependency that application code imports directly.
- Prefer local minimal HTTP request/response shapes for internal NestJS helpers when only a small adapter surface is needed.

## Recomendado

- Start with a modular monolith.
- Name use cases and services with business verbs.
- Keep infrastructure adapters separate from application rules.

## Proibido

- Put business rules in controllers, middleware, resolvers, or visual components.
- Return stack traces, ORM errors, or database details to the user.
- Add circular dependencies between modules.
- Retry external calls indefinitely.
- Import Express/Fastify adapter types directly without declaring the matching package and type dependency.
