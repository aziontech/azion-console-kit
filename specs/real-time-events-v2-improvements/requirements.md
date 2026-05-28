# Requirements: Real-Time Events V2 Improvements

## Overview

This spec covers critical improvements to the Real-Time Events V2 module: enabling query sharing via shareable links, fixing GraphQL errors in specific dataset tabs, restoring saved search persistence, and stabilizing the Add Filter modal width. Together, these changes improve discoverability, reliability, and UX stability for data analysts and operations teams who rely on Real-Time Events for monitoring and troubleshooting.

## Personas

- **Data Analyst**: Explores events across datasets (HTTP, Functions, DNS, etc.), builds custom queries, and needs to share findings with team members.
- **Operations Engineer**: Uses saved searches as quick-access templates for common troubleshooting patterns; expects them to persist across sessions.
- **Support/Oncall**: Operates Real-Time Events on mobile and desktop; needs stable, predictable UI dimensions for rapid navigation.

## User Stories & Acceptance Criteria

### 1. Query Sharing via Shareable Links

**User Story:** As a Data Analyst, I want to generate a shareable link that encodes the current query state (filters, dataset, page size, visible fields), so that I can paste it in Slack/email and others can open the exact same view without reconfiguring it manually.

**Acceptance Criteria:**

1.1 When the user clicks the "Share" button (pi-share-alt icon) in the toolbar, the system shall generate a URL containing an encoded `shareState` query parameter.

1.2 The encoded share state shall include: active tab/panel, filters (operator, field, value), dataset selection, page size, and selected columns/fields.

1.3 The system shall copy the generated URL to the clipboard and display a toast notification: "Share URL copied to clipboard" (success, 3s duration).

1.4 If clipboard write fails (e.g., missing HTTPS, permission denied), the system shall display an error toast: "Error generating share URL" with detail (5s duration) instead of silently succeeding.

1.5 When a user opens a URL with `?shareState=<encoded>`, the system shall decode the state and apply filters, dataset, page size, and field selection to the current view without requiring manual reconfiguration.

1.6 If the share state contains a custom panel that is not already saved locally, the system shall create an ephemeral "shared tab" (not persisted) so the recipient can open it and optionally save it as a custom session.

1.7 The system shall validate the decoded share state; if malformed or corrupted, it shall display an error toast and remove the `shareState` parameter from the URL.

### 2. Fix GraphQL Errors in Dataset Tabs

**User Story:** As a Data Analyst, I want to view data in Function, Function Console, Data Stream, Edge DNS, and Activity History tabs without GraphQL errors, so that I can explore all datasets reliably.

**Acceptance Criteria:**

2.1 When the user selects the Function Events tab, the system shall execute the query without a groupBy-related GraphQL error.

2.2 When the user selects the Function Console Events tab, the system shall execute the query without a groupBy-related GraphQL error.

2.3 When the user selects the Data Stream Events tab, the system shall execute the query without a groupBy-related GraphQL error.

2.4 When the user selects the Edge DNS Queries tab, the system shall execute the query without a groupBy-related GraphQL error.

2.5 When the user selects the Activity History tab, the system shall execute the query without a groupBy-related GraphQL error.

2.6 The system shall render event tables and charts for all above tabs with correct data (no empty states due to query failure).

2.7 If a query fails with a GraphQL error, the system shall log the error to console (dev tools) and display a user-facing error toast with remediation guidance (e.g., "Error loading events. Please try again or contact support.").

### 3. Restore Saved Searches Persistence

**User Story:** As an Operations Engineer, I want to save custom filter configurations as named searches and have them persist across page reloads and browser sessions, so that I can quickly reuse common troubleshooting queries without reconfiguring them.

**Acceptance Criteria:**

3.1 When the user creates a new saved search (name, filters, dataset, and optional description), the system shall persist it to localStorage with a unique ID.

3.2 When the user reloads the page, the system shall restore all saved searches from localStorage and display them in the Saved Searches dropdown/panel.

3.3 When the user clicks a saved search, the system shall apply its filters, dataset, and other state to the current view.

3.4 When the user deletes a saved search, it shall be removed from localStorage and the UI immediately.

3.5 If localStorage is unavailable (private browsing, quota exceeded, or blocked), the system shall gracefully degrade: display a warning toast ("Saved searches unavailable in this session") but allow the user to continue querying without loss of functionality.

3.6 The system shall validate saved search data on load; if corrupted or malformed, skip that entry, log to console, and continue loading other saved searches.

3.7 Saved searches shall be keyed by dataset, so the user can reuse the same search name across different datasets without collision.

### 4. Stabilize "Add Filter" Modal Width

**User Story:** As a Support Engineer, I want the "Add Filter" modal to maintain a fixed, predictable width regardless of the selected filter field or operator, so that I can navigate filters quickly on mobile and desktop without visual jank or layout shifts.

**Acceptance Criteria:**

4.1 The system shall render the "Add Filter" modal with a fixed width (responsive breakpoint-aware, e.g., 35rem on desktop, 90vw on mobile with max 35rem).

4.2 When the user selects different filter fields (string, number, enum, date), the modal width shall remain constant.

4.3 When the user selects different operators (equals, contains, gt, lt, between), the modal width shall remain constant.

4.4 When the filter input changes (text input, dropdown, date picker, number range), the modal width shall remain constant; internal content shall reflow as needed.

4.5 The modal shall not shift or resize during the lifecycle of a single filter selection/configuration.

4.6 On viewport resize (e.g., orientation change from portrait to landscape), the modal width shall adapt to the new breakpoint but remain stable during the resize transition (no flickering).

## Non-Functional Requirements

### Performance

N.1 Generating a share URL shall complete in under 100ms (encoding + clipboard write).

N.2 Decoding a share state from URL on page load shall complete in under 50ms.

N.3 Restoring saved searches from localStorage shall complete in under 200ms even with 50+ saved searches.

### Accessibility

N.4 The "Share" button shall have an accessible label: `aria-label="Share current view"` and tooltip on hover.

N.5 The "Add Filter" modal shall trap focus and support keyboard navigation (Tab, Escape to close, Enter to confirm).

N.6 Error toasts shall announce text to screen readers and persist long enough for users to read (min 3s).

### Security

N.7 Share URLs shall be URL-safe (no unencoded special characters); the encoded state shall not expose PII or sensitive filter values in plaintext.

N.8 Clipboard write shall only occur on explicit user action (button click); no background/silent writes.

### Observability

N.9 Share generation success/failure shall be logged (e.g., `{ event: 'share_url_copied', success: true, timestamp }` or with error details on failure).

N.10 Saved search CRUD operations (create, load, delete) shall be logged for debugging persistence issues.

## Out of Scope

- Implementing a backend API for persistent cross-device saved searches (localStorage-only in this spec).
- Adding collaborative/real-time sharing features (multi-user editing of shared queries).
- Redesigning the Add Filter modal component itself (only stabilizing width; no new fields or operators).
- Automatic share URL expiry or access control (shares are public if URL is known).
- Analytics or usage tracking on shared URLs (logging is internal only).

## Open Questions

- [ ] Should saved searches be scoped per-user (if multi-user support is planned) or globally by browser?
- [ ] For the GraphQL errors, should we validate the exact error message pattern or fix blindly across all 5 tabs?
- [ ] Is there a defined max width for the Add Filter modal on desktop, or should it adapt to the viewport?
- [ ] Should clipboard fallback (if Clipboard API unavailable) use a fallback like showing the URL in a modal for manual copy?
