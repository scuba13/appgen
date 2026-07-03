# AppGen Final Flow

The final AppGen flow generates a complete app, not only a scaffold.

```text
brief -> standards -> product -> architecture -> specs -> scaffold -> slicer -> implementation-loop -> acceptance -> docs -> handoff
```

## Flow Responsibilities

| Step | Responsibility |
|---|---|
| `brief` | Capture business goal, users, scope, constraints, and acceptance criteria. |
| `standards` | Consolidate company profile and standards into `standards-map.md`. |
| `product` | Produce a testable product spec. |
| `architecture` | Produce target architecture, domain model, data model, API contracts, and UI spec. |
| `specs` | Produce feature specs and quality score. |
| `scaffold` | Create the app monorepo in `app_root`. |
| `slicer` | Break the app into vertical implementation slices. |
| `implementation-loop` | Run coder, QA, and quality until slices are done or blocked. |
| `acceptance` | Prepare local preview, collect user feedback, and record explicit approval. |
| `docs` | Generate app documentation and an offline-friendly project HTML. |
| `handoff` | Consolidate delivery, validation, risks, feedback history, and next steps. |

## Acceptance Feedback Routing

| Feedback Type | Route |
|---|---|
| `technical` | Back to `implementation-loop`. |
| `business` | Back to product/spec clarification. |
| `environment` | Environment blocker for preview. |

Feedback is append-only in `_appgen_work/user-feedback.md` and `_appgen_work/acceptance-history.jsonl`.
