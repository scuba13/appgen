# CI/CD Standard

## Obrigatorio

- The generated app must define commands for lint, typecheck, test, and build.
- Pull requests must run required quality gates before merge.
- Releases must identify changed features, migrations, and operational risks.
- CI must fail on high-severity security findings when the profile requires it.

## Recomendado

- Run faster checks before slower E2E/build checks.
- Cache package-manager dependencies in CI.
- Publish test and build evidence in release notes when applicable.

## Proibido

- Bypass required checks without an approved exception.
- Deploy unreviewed migrations to production.
