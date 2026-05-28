# Real-Time Events V2 — Manual Test Stories (Wave 5)

These stories are the manual companions to the automated tests in
`/cypress/e2e/real-time-events/` and `/src/**/__tests__/**`. Each story
maps to one or more optional tasks in `tasks.md`.

Run these checks before promoting Wave 5 / Wave 6 to staging. Each
takes < 5 minutes; together they cover paths that jsdom-based unit
tests cannot exercise (real clipboard, real layout, real mobile).

---

## Story 5.4* — Share URL Round-Trip (Manual)

**Validates: Requirements 1.1, 1.2, 1.3, 1.5**

1. Open Real-Time Events V2 in Chrome (dev tenant).
2. Apply two filters: `status = 500` AND `host = api.example.com`.
3. Click the **Share** button.
   - Expected: success toast "Share URL copied to clipboard" appears.
   - Expected: `navigator.clipboard.readText()` (paste into devtools)
     returns the URL with `?shareState=…`.
4. Open the copied URL in a new tab (logged-in or incognito with the
   same tenant).
   - Expected: the same filters appear in the input.
   - Expected: the same dataset is selected.
   - Expected: `pageSize` and `selectedFields` are restored.
5. With a custom panel (any tab created via "Save as Session"):
   - Click Share → open URL in a new tab.
   - Expected: a tab labeled with the panel's name appears,
     marked as **shared / ephemeral** (not in the saved sessions list).
   - Expected: the tab can be saved (button promotes it from ephemeral
     to persisted).

---

## Story 10.5* — Verify Tabs Load Without Errors

**Validates: Requirements 2.1–2.6**

1. Open Real-Time Events V2.
2. Click each of these tabs in order:
   - Function Events
   - Function Console Events
   - Data Stream Events
   - Edge DNS Queries
   - Activity History
3. For each tab, verify:
   - No `p-toast-message-error` appears.
   - The chart area shows either a chart (if there's data in the time
     range) or the empty-state component (if no data).
   - The DevTools Network tab shows the GraphQL POST returning 200.
   - The request body's `query` field contains `groupBy: [ts]` only —
     no `status` / `requestMethod` / `upstreamCacheStatus`.

If any tab shows an error toast: capture the request payload and check
that `DATASET_SUPPORTS_GROUPBY` in `load-events-aggregation.js` has the
correct whitelist for that dataset.

---

## Story 11.2* — GraphQL Error Handling

**Validates: Requirements 2.7, N.9**

1. Open Real-Time Events V2.
2. Open Chrome DevTools → Network tab → right-click the GraphQL endpoint
   row → **Block request URL**.
3. Click any tab (e.g. Function Events) to trigger a new GraphQL request.
4. Expected:
   - An error toast appears with friendly text:
     **"Error loading events. Please try again or contact support."**
   - The toast severity is `error`.
   - Console contains the structured log:
     `[real-time-events] GraphQL query failed { dataset: ..., groupByField: ..., error: ... }`.
5. Unblock the request URL → click the tab again → data should load
   (or empty state if no data in range) — no leftover error state.

---

## Story 13.5* — Mobile Modal Width Stability

**Validates: Requirements 4.1–4.6, N.5**

Run on either:
- A real iPhone / iPad with the staging build, OR
- Chrome DevTools "Toggle device toolbar" set to iPhone 12 (390×844)
  and iPad Mini (768×1024).

1. Open Real-Time Events V2.
2. Click **Add Filter** to open the modal.
3. Expected (mobile, < 640px viewport):
   - Modal width fills the viewport minus a `1rem` margin
     (calc(100vw - 1rem) → about 374px on iPhone 12).
   - No horizontal scroll on the page.
4. In the modal, change the filter **field** from a string field
   (e.g. `host`) to a multiselect field (e.g. `status`):
   - Expected: modal width does NOT change. No resize flash, no jank.
5. Change the **operator** from `equals` to `in`:
   - Expected: modal width does NOT change.
6. Repeat steps 2–5 at 768px (tablet) — width should be
   `min(35rem, 90vw)` ≈ 560px.
7. Repeat at desktop ≥ 1024px — width should be 35rem (560px) exactly.

**Touch targets** (WCAG AA, N.5):
- Each filter operator chip and the close button must be at least 44×44 px.
- Verify via DevTools "Inspect" → check the bounding box.

---

## Story 15.4* — Cross-Browser Share URL

**Validates: Requirements 1.3, 1.4, N.8**

Run the Story 5.4* steps on:
1. Chrome (latest) — clipboard.writeText() expected to succeed.
2. Firefox (latest) — clipboard.writeText() expected to succeed.
3. Safari (latest, macOS) — verify either success OR the
   `FallbackCopyDialog` appears with a manually-copyable URL.

For each browser, confirm:
- Success path: green toast + URL in clipboard.
- Fallback path (if clipboard blocked): info toast + dialog with the
  URL visible in a read-only input + a "Copy" button that selects all
  text and runs `document.execCommand('copy')`.

---

## Story 15.5* — Accessibility Review

**Validates: Requirements N.4, N.5, N.6**

Tested with macOS VoiceOver (Cmd+F5) or NVDA on Windows.

1. After clicking Share, the success toast must be announced.
2. The Saved Searches dropdown must be navigable via Tab/Arrow keys:
   - Tab to the trigger button → Enter to open.
   - Arrow Down/Up to move between items.
   - Enter to apply the search.
   - Escape to close the dropdown.
3. Error toasts must be readable by the screen reader (they should
   have `role="alert"` or be inside an `aria-live="assertive"` region).
4. The Add Filter modal must trap focus while open and return focus
   to the trigger on close (deferred — Add Filter a11y is not in
   scope for this phase).

---

## Story 15.6* — Mobile Responsiveness Across All 4 Features

**Validates: Requirements 4.1–4.6, N.4**

On mobile viewport (iPhone 12, 390×844):
1. **Share button** is visible and tappable (44×44 minimum).
2. **Fallback copy dialog** (if clipboard fails) fits the screen with
   no horizontal scroll.
3. **Saved Searches overlay** is scrollable when more than ~6 entries
   exist; no clipping at viewport edges.
4. **Add Filter modal** width is stable per Story 13.5*.

---

## Sign-off Checklist (Wave 6 closure)

- [ ] Story 5.4 — Share URL round-trip OK
- [ ] Story 10.5 — All 5 tabs load OK
- [ ] Story 11.2 — Error toast on GraphQL failure OK
- [ ] Story 13.5 — Modal width stable on mobile OK
- [ ] Story 15.4 — Cross-browser share OK
- [ ] Story 15.5 — Accessibility OK
- [ ] Story 15.6 — Mobile responsiveness OK
