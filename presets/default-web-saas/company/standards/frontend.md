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
- Frontend data access must go through API/client helpers, never directly through Prisma or database clients.
- Every user flow must have clear primary and secondary actions, including back/cancel navigation on detail, create, edit, review, and confirmation screens.
- Screens must be usable on desktop and mobile, with visible navigation, readable hierarchy, and no dead placeholder controls.

## Recomendado

- Separate layout components, domain components, and data-access code.
- Keep complex data transformations out of JSX.
- Avoid duplicating DTOs, enums, and validation already available in shared packages.

## Proibido

- Enforce authorization only in the frontend.
- Duplicate critical business rules inside visual components.
- Use global state for data that belongs to a single screen.
- Show technical error messages to end users.
- Import `@prisma/client`, Prisma services, database clients, repositories, or backend-only infrastructure.
- Ship create/edit/detail/review screens without an obvious `Voltar`, `Cancelar`, or equivalent safe-exit action.
