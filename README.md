# AppGen

AppGen is an agent-driven framework for generating complete corporate web apps from business intent and company standards.

The normal flow is:

```text
brief -> standards -> product -> architecture -> specs -> scaffold -> slicer -> implementation-loop -> acceptance -> docs -> handoff
```

The business user describes goals, rules, priorities, exceptions, and acceptance criteria. Technical decisions such as framework, database, architecture, testing, observability, and deployment conventions are resolved by AppGen agents using the installed company profile.

## Install In A Project

```bash
npx appgen install
```

Then open your agent environment and type:

```text
appgen
```

## Core Commands

```bash
appgen status
appgen next
appgen scaffold
appgen loop
appgen acceptance
appgen docs
```

## Company Profiles

The default install copies a profile to:

```text
.appgen/company/
```

Use a custom profile with:

```bash
appgen install --company ./company-profiles/acme
```

The profile controls standards for backend, frontend, database, API, design system, security, observability, testing, CI/CD, deployment, and compliance.

## Generated App

The default preset generates a monorepo in `app/`:

```text
app/
  apps/web
  apps/api
  packages/shared
  docs/
```

The acceptance step can generate `app/docker-compose.yml` for local preview and records all user feedback until explicit approval.

## Documentation And Handoff

`appgen docs` creates Markdown docs and an offline-friendly HTML summary in:

```text
app/docs/project.html
```

`appgen-handoff` then consolidates delivery status, validation evidence, feedback history, risks, and next steps.
