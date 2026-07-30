/* eslint-disable no-console */
/**
 * Wave 0 — Characterization guard for the SHARE-VIEW ROUND-TRIP seam.
 *
 * Seam: "encode current view (selected view + filters + tab) → URL
 * (?shareState=...) → decode → same state".
 *
 * The pure `encodeShareState`/`decodeShareState` codec is already pinned by
 *   - services/panels-service/__tests__/encode-decode.pbt.spec.js
 *   - services/panels-service/__tests__/shareState.pbt.spec.js
 *   - composables/__tests__/share-state.prop.test.js  (tab + viewState + eventsTab)
 * and the filter⇄hash codec by useFilterActions.roundtrip.prop.test.js. The
 * clipboard promise ordering of `shareCurrentView` is pinned by
 * shareCurrentView.pbt.spec.js.
 *
 * NOT yet pinned — and directly in the blast radius of tasks 9.3/9.4 (make
 * filter + view single-source-of-truth with the hash derived): the
 * END-TO-END observable round-trip through `useSessionManager`:
 *
 *   shareCurrentView({ viewState, eventsTab })  →  ?shareState=<encoded> in URL
 *   initializePanels()  →  handleShareImport()  →  restores:
 *       - activeTabId          (the selected view/tab)
 *       - pendingShareViewState (the filters + view state)
 *       - pendingEventsTabState (the events tab identity + its viewState)
 *   ... and STRIPS shareState from the URL afterwards.
 *
 * These tests drive the real composable + the real panels-service codec (NOT
 * mocked) so the observable contract we must preserve through the refactor is
 * captured against the actual encode/decode path.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/modules/real-time-metrics/constants/reports', () => ({
  default: []
}))

import { useSessionManager } from '../useSessionManager.js'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeFixture(query = {}) {
  const route = { name: 'real-time-events', params: {}, query: { ...query } }
  const router = { replace: vi.fn() }
  const toast = { add: vi.fn() }
  return { route, router, toast }
}

/**
 * Stub navigator.clipboard.writeText to CAPTURE the URL that
 * `shareCurrentView` writes, and resolve immediately so the happy path runs.
 * Returns { getWrittenUrl, restore }.
 */
function withCapturingClipboard() {
  let written = null
  const writeText = vi.fn((text) => {
    written = text
    return Promise.resolve()
  })
  const originalClipboard = Object.getOwnPropertyDescriptor(window.navigator, 'clipboard')
  const originalSecure = Object.getOwnPropertyDescriptor(window, 'isSecureContext')

  Object.defineProperty(window.navigator, 'clipboard', {
    configurable: true,
    writable: true,
    value: { writeText }
  })
  Object.defineProperty(window, 'isSecureContext', {
    configurable: true,
    writable: true,
    value: true
  })

  function restore() {
    if (originalClipboard) Object.defineProperty(window.navigator, 'clipboard', originalClipboard)
    else delete window.navigator.clipboard
    if (originalSecure) Object.defineProperty(window, 'isSecureContext', originalSecure)
    else delete window.isSecureContext
  }

  return { getWrittenUrl: () => written, restore }
}

/**
 * Extract the `shareState` query value from a full URL string, decoding the
 * percent-encoding that URL/searchParams applied to the Base64 payload.
 */
function extractShareState(urlString) {
  const url = new URL(urlString)
  return url.searchParams.get('shareState')
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useSessionManager · share-view round-trip (Wave 0 characterization)', () => {
  let restoreClipboard = null

  beforeEach(() => {
    vi.spyOn(console, 'info').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    if (restoreClipboard) {
      restoreClipboard()
      restoreClipboard = null
    }
    vi.restoreAllMocks()
  })

  it('shareCurrentView → shareState in URL → import restores view (tab) + filters (viewState)', async () => {
    const { getWrittenUrl, restore } = withCapturingClipboard()
    restoreClipboard = restore

    // Producer side: an active pinned Events view (tab === null) with a
    // filter-bearing viewState.
    const producer = makeFixture()
    const producerSession = useSessionManager(producer)
    // activeTabId defaults to null (the pinned "Events" view) — that IS the
    // selected view we expect to round-trip.
    expect(producerSession.activePanel.value).toBeNull()

    const viewState = {
      filters: { host: 'api.example.com', status: '200' },
      dataset: 'workloadEvents',
      pageSize: 100,
      selectedFields: ['host', 'status']
    }

    await producerSession.shareCurrentView({ viewState })

    const shareState = extractShareState(getWrittenUrl())
    expect(shareState).toBeTruthy()

    // Consumer side: a fresh session opened on the shared URL.
    const consumer = makeFixture({ shareState })
    const consumerSession = useSessionManager(consumer)
    consumerSession.initializePanels()

    // Selected view (tab) round-trips: null pinned Events view stays selected.
    expect(consumerSession.activePanel.value).toBeNull()
    // Filters + view state round-trip verbatim into the pending buffer that
    // TabsView applies to the active panel.
    expect(consumerSession.pendingShareViewState.value).toEqual(viewState)
    // No eventsTab was shared → pendingEventsTabState stays null.
    expect(consumerSession.pendingEventsTabState.value).toBeNull()

    // Side effect: the shareState param is stripped from the URL after import.
    expect(consumer.router.replace).toHaveBeenCalled()
    const lastReplace = consumer.router.replace.mock.calls.at(-1)[0]
    expect(lastReplace.query.shareState).toBeUndefined()
  })

  it('round-trip carries an eventsTab (identity + its viewState) into pendingEventsTabState', async () => {
    const { getWrittenUrl, restore } = withCapturingClipboard()
    restoreClipboard = restore

    const producer = makeFixture()
    const producerSession = useSessionManager(producer)

    const viewState = {
      filters: { name: 'my-fn' },
      dataset: 'functionEvents',
      pageSize: 50,
      selectedFields: ['name']
    }
    const eventsTab = { id: 'fn-tab-1', label: 'Functions', dataset: 'functionEvents' }

    await producerSession.shareCurrentView({ viewState, eventsTab })

    const shareState = extractShareState(getWrittenUrl())
    const consumer = makeFixture({ shareState })
    const consumerSession = useSessionManager(consumer)
    consumerSession.initializePanels()

    // eventsTab identity is preserved AND merged with the shared viewState.
    // CURRENT behavior: pendingEventsTabState spreads the decoded eventsTab and
    // attaches `viewState` (see handleShareImport). We pin the full shape.
    expect(consumerSession.pendingEventsTabState.value).toEqual({
      ...eventsTab,
      viewState
    })
    // pendingShareViewState also carries the same viewState (both buffers are
    // populated for an eventsTab share).
    expect(consumerSession.pendingShareViewState.value).toEqual(viewState)
  })

  it('share-over-limit guard: a shared custom panel does NOT bypass the unified ceiling (req 2.5 / C7)', async () => {
    const { getWrittenUrl, restore } = withCapturingClipboard()
    restoreClipboard = restore

    // Producer shares a custom panel inline (state.panelConfig) so the consumer
    // would otherwise create an ephemeral shared tab from it.
    const sharedPanel = {
      id: 'shared-panel-x',
      label: 'Shared X',
      icon: 'pi pi-star',
      type: 'custom',
      charts: [{ reportId: 'r1' }]
    }
    const producer = makeFixture()
    const producerSession = useSessionManager(producer)
    // Seed the producer with the panel and make it the active tab so
    // shareCurrentView embeds panelConfig into the encoded state.
    producerSession.panels.value = [sharedPanel]
    producerSession.openTabs.value = [
      ...producerSession.openTabs.value,
      { id: sharedPanel.id, label: sharedPanel.label, icon: sharedPanel.icon, closable: true }
    ]
    producerSession.activeTabId.value = sharedPanel.id

    const viewState = { filters: { host: 'x' }, dataset: 'workloadEvents' }
    await producerSession.shareCurrentView({ viewState })

    const shareState = extractShareState(getWrittenUrl())
    expect(shareState).toBeTruthy()

    // Consumer is already AT the ceiling: inject canOpenNewTab === false so the
    // shared tab admission must be refused, exactly like openTab.
    const consumer = makeFixture({ shareState })
    const consumerSession = useSessionManager({
      ...consumer,
      canOpenNewTab: () => false
    })

    const tabsBefore = consumerSession.openTabs.value.length
    consumerSession.initializePanels()

    // No new tab was appended (the shared tab was NOT admitted).
    expect(consumerSession.openTabs.value.length).toBe(tabsBefore)
    expect(consumerSession.openTabs.value.some((tab) => tab.id === sharedPanel.id)).toBe(false)

    // A warn "tab limit reached" toast was surfaced, mirroring openTab.
    const warnToast = consumer.toast.add.mock.calls
      .map((call) => call[0])
      .find((arg) => arg.severity === 'warn' && /tab limit reached/i.test(arg.summary ?? ''))
    expect(warnToast).toBeTruthy()

    // The shared view still round-trips: viewState is buffered and the active
    // tab falls back to the pinned Events tab (null) instead of a phantom tab.
    expect(consumerSession.pendingShareViewState.value).toEqual(viewState)
    expect(consumerSession.activePanel.value).toBeNull()
  })

  it('within-limit shared custom panel IS admitted as an ephemeral shared tab (guard does not over-block)', async () => {
    const { getWrittenUrl, restore } = withCapturingClipboard()
    restoreClipboard = restore

    const sharedPanel = {
      id: 'shared-panel-y',
      label: 'Shared Y',
      icon: 'pi pi-star',
      type: 'custom',
      charts: [{ reportId: 'r1' }]
    }
    const producer = makeFixture()
    const producerSession = useSessionManager(producer)
    producerSession.panels.value = [sharedPanel]
    producerSession.openTabs.value = [
      ...producerSession.openTabs.value,
      { id: sharedPanel.id, label: sharedPanel.label, icon: sharedPanel.icon, closable: true }
    ]
    producerSession.activeTabId.value = sharedPanel.id

    await producerSession.shareCurrentView({ viewState: { filters: {} } })
    const shareState = extractShareState(getWrittenUrl())

    // Consumer under the limit (canOpenNewTab true) admits the shared tab.
    const consumer = makeFixture({ shareState })
    const consumerSession = useSessionManager({
      ...consumer,
      canOpenNewTab: () => true
    })
    consumerSession.initializePanels()

    expect(
      consumerSession.openTabs.value.some((tab) => tab.id === sharedPanel.id && tab.shared)
    ).toBe(true)
    expect(consumerSession.activePanel.value).toBe(sharedPanel.id)
  })

  it('an invalid shareState decodes to null → error toast, no view/filter applied, param stripped', () => {
    // Garbage that decodeShareState rejects (not valid base64/JSON with ver:1).
    const consumer = makeFixture({ shareState: '!!!not-a-valid-share!!!' })
    const consumerSession = useSessionManager(consumer)
    consumerSession.initializePanels()

    expect(consumerSession.pendingShareViewState.value).toBeNull()
    expect(consumerSession.pendingEventsTabState.value).toBeNull()

    // Error toast surfaced to the user.
    const errorToast = consumer.toast.add.mock.calls
      .map((call) => call[0])
      .find((arg) => arg.severity === 'error')
    expect(errorToast).toBeTruthy()
    expect(errorToast.summary).toMatch(/invalid share link/i)

    // Param stripped even on the invalid path.
    const replacedWithoutShareState = consumer.router.replace.mock.calls
      .map((call) => call[0])
      .some((arg) => arg.query && arg.query.shareState === undefined)
    expect(replacedWithoutShareState).toBe(true)
  })
})
