# Security Standard

## Obrigatorio

- Use server-side validation for all external input.
- Enforce authentication and authorization on the backend.
- Store secrets only in environment or secret-manager mechanisms.
- Do not log secrets, tokens, passwords, or sensitive personal data.
- Classify sensitive data and apply LGPD/compliance requirements when applicable.
- Add safe error handling for authentication and authorization failures.
- Apply rate limiting or abuse protection to public or sensitive endpoints.

## Recomendado

- Prefer OIDC for authentication.
- Use least-privilege service credentials.
- Review dependencies before adding new runtime packages.

## Proibido

- Commit secrets to version control.
- Trust frontend-only authorization.
- Return sensitive implementation details in API errors.
