# Company Profile

Company profiles are the customization boundary for AppGen.

The installed profile lives in:

```text
.appgen/company/
```

A profile contains:

```text
profile.toml
standards/
templates/
assets/
hooks.yml
```

Technical agents read the company profile before making architecture, implementation, QA, quality, acceptance, documentation, or handoff decisions.

## Resolution Order

1. Explicit approved project decision.
2. Company profile.
3. Preset defaults.
4. AppGen defaults.

The business user should not choose technical stack, ORM, framework, CI/CD, folder structure, or testing tools.
