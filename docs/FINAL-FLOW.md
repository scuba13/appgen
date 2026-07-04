# AppGen Final Flow

The final AppGen flow generates a complete app, not only a scaffold.

```text
brief -> standards -> product -> architecture -> environment -> specs -> scaffold -> slicer -> implementation-loop -> acceptance -> docs -> handoff
```

## Flow Responsibilities

| Step | Responsibility |
|---|---|
| `brief` | Capture business goal, users, scope, constraints, and acceptance criteria. |
| `standards` | Consolidate company profile and standards into `standards-map.md`. |
| `product` | Produce a testable product spec. |
| `architecture` | Produce target architecture, domain model, data model, API contracts, and UI spec. |
| `environment` | Check Docker/Compose and plan isolated containers for preview and tests. |
| `specs` | Produce feature specs and quality score. |
| `scaffold` | Show `_appgen_work/build-summary.md`, then create the app monorepo in `app_root`. |
| `slicer` | Break the app into vertical implementation slices. |
| `implementation-loop` | Run coder, QA, quality, and preview-validation until slices are ready for user test or blocked. |
| `acceptance` | Provide `_appgen_work/acceptance-test-guide.md`, collect user feedback, and record explicit approval. |
| `docs` | Generate app documentation and an offline-friendly project HTML. |
| `handoff` | Consolidate delivery, validation, risks, feedback history, and next steps. |

## Acceptance Feedback Routing

| Feedback Type | Route |
|---|---|
| `technical` | Back to `implementation-loop`. |
| `business` | Back to product/spec clarification. |
| `environment` | Environment blocker for preview. |

Feedback is append-only in `_appgen_work/user-feedback.md` and `_appgen_work/acceptance-history.jsonl`.
