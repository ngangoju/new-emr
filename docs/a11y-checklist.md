# Accessibility (a11y) Audit Checklist — Phase 2.7

Verified baseline + remaining items for the premium EMR frontend.

## Already in place (verified)
- [x] **Reduced motion** — `prefers-reduced-motion` media query in `src/app/globals.css`
      disables `animate-emergency`, `animate-fade-in`, `animate-slide-*`,
      `animate-scale-in`, `animate-shake`.
- [x] **Focus rings** — interactive controls use `focus:outline-none focus:ring-2
      focus:ring-ring` (see `Header.tsx` logout/theme buttons, dialog close).
- [x] **Semantic status, not color-only** — `StatusBadge` (`src/components/shared/StatusBadge.tsx`)
      always pairs a tone *with* an icon + text label (`data-tone`, `data-status`
      attributes for testing). Never color-alone.
- [x] **Command palette** — `Cmd/Ctrl+K` opens; `aria-label="Open command palette"`.
- [x] **Skip/empty states** — `ui/empty-state.tsx` exists for list/table zero-data.

## TODO (before GA / multi-facility rollout)
- [ ] **axe-core in CI** — add `vitest` + `jest-axe` (or Playwright `axe`) to the
      critical-e2e lane so regressions block PRs. Needs a running app
      (backend :8888 + frontend :3000) — run in the e2e workflow, not unit.
- [ ] **Playwright screenshot baselines** — add `playwright.critical.config.ts` step
      that captures per-role dashboards in light + dark for visual-regression
      diffing (store in `test-results/`; wire to a PR check).
- [ ] **Focus management on dialogs/modals** — confirm every `Dialog` returns focus to
      the trigger on close (Radix `Dialog` does this by default; audit custom modals
      in `CheckInModal`, `PatientRegistrationModal`, `DoctorSelector`, `PatientSelector`).
- [ ] **Live region for toasts/errors** — `toaster-provider.tsx` toasts should announce
      via `role="status"` / `aria-live="polite"`; the blocking "Action Failed"
      modal uses `DialogTitle`/`DialogDescription` (good). Add `aria-live` to the
      non-blocking toast container.
- [ ] **Form labels** — every `Input`/`Select`/`Textarea` has an associated
      `<label>` or `aria-label` (RHF + zod migration in 2.3 should enforce this).
- [ ] **Table semantics** — `WorklistTable` (`src/components/shared/WorklistTable.tsx`)
      must render real `<table><thead><th scope="col">` (not divs) so
      screen readers announce columns. Verify before adopting it in `InvoicesTable`.
- [ ] **Color contrast** — verify token pairs (`text-muted-foreground` on `bg-card`,
      `text-foreground` on `bg-background`) meet WCAG AA at the chosen shades;
      the dark-panel `slate-*` usages in `BillingDashboard` financial summary
      are intentional dark-on-color and should be spot-checked.

## How to verify locally
1. `npm run dev` (frontend :3000) + backend :8888.
2. `npx playwright test --config playwright.critical.config.ts` (existing critical lane).
3. Add `--axe` once the axe step lands.
4. Manual: keyboard-only tab through `dashboard/reception`, `dashboard/billing`,
   `dashboard/lab`; confirm visible focus ring + logical order.
