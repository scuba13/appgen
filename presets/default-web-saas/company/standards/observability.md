# Observability Standard

## Obrigatorio

- Use structured logs in backend services.
- Propagate or create a correlation ID for requests.
- Provide a health check endpoint for the API.
- Log important business operations and security-relevant events.
- Keep user-facing messages separate from diagnostic logs.
- Document minimum metrics or operational signals for critical flows.

## Recomendado

- Include request method, route, status, latency, and correlation ID in request logs.
- Emit audit records for critical entity changes.
- Define log retention expectations when compliance applies.

## Proibido

- Log secrets, tokens, raw passwords, or sensitive personal data.
- Use console-only debugging as the operational logging strategy.
