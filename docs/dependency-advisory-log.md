# Frontend Dependency Advisory Log

**Last reviewed:** 2026-06-18  
**Scope:** production frontend dependencies in `new-emr`

This file records dependency findings that are below the current CI fail threshold or are otherwise formally accepted for a limited period.

---

## Open exceptions

### 1. `exceljs -> uuid`

- **Current severity:** Moderate
- **Observed via:** `npm audit --omit=dev --audit-level=high`
- **Package chain:** `exceljs` depends on `uuid`
- **Why it is not CI-blocking today:** current frontend CI fails on high-and-above; this finding is currently below that threshold
- **Exploit surface in this app:** low relative to the former `xlsx` chain, because exports are generated from application-controlled data rather than arbitrary third-party workbook input
- **Owner:** frontend/platform maintainers
- **Next review date:** next dependency-refresh cycle or by 2026-07-18, whichever comes first
- **Planned follow-up:** keep watching `exceljs` releases; if the advisory worsens or a safer export path emerges, replace or redesign the Excel export dependency chain

## Closed exceptions

### 1. `xlsx`

- **Prior severity:** High
- **Disposition:** removed from the repo and replaced with `exceljs`
- **Closed on:** 2026-06-18

### 2. Next.js / axios high-critical chain from the June 10 audit

- **Disposition:** resolved in the current repo state
- **Closed on:** 2026-06-18
