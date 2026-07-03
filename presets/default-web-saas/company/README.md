# Default Company Profile

This profile contains the default corporate rules used by the AppGen final app flow.

The business user should not choose technical stack, tools, folders, CI, cloud,
or quality gates. Technical agents must resolve those choices from this
profile, the preset, and explicit approved project decisions.

Resolution order:

1. Explicit approved project decision.
2. Company profile.
3. Preset defaults.
4. AppGen defaults.

The legacy `.appgen/standards/company-standards.md` file is still installed for
compatibility. New agents should prefer `.appgen/company/profile.toml` and the
area files under `.appgen/company/standards/`.
