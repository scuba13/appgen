# Testing Standard

## Obrigatorio

- Configure lint, typecheck, unit tests, and build.
- Use Vitest for unit tests by default.
- Use Playwright for E2E tests by default.
- Cover the main happy path for every Must feature.
- Cover important validation and authorization failures.
- Use factories or builders for test data when setup becomes repetitive.
- Mock external systems at boundaries, not internal business rules.

## Recomendado

- Keep unit tests close to the code they exercise.
- Add integration tests for API and persistence behavior that carries business risk.
- Keep E2E tests focused on critical user journeys.

## Proibido

- Mark a feature done with no executable validation unless an environment blocker is documented.
- Silence failing tests to pass the build.
