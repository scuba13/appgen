# Frontend Standard

## Obrigatorio

- Use Next.js App Router and TypeScript for the default web app.
- Use Ant Design for the PoC unless the company design system replaces it.
- Keep critical business rules out of visual components.
- Use shared contracts or schemas derived from the official source for screen flows.
- Prefer local state for local interactions; justify global state.
- Validate forms on the client for UX and on the server for security.
- Handle loading, empty, error, forbidden, and success states where applicable.
- Use business names for domain components.

## Recomendado

- Separate layout components, domain components, and data-access code.
- Keep complex data transformations out of JSX.
- Avoid duplicating DTOs, enums, and validation already available in shared packages.

## Proibido

- Enforce authorization only in the frontend.
- Duplicate critical business rules inside visual components.
- Use global state for data that belongs to a single screen.
- Show technical error messages to end users.
