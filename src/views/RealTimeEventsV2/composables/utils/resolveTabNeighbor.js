/**
 * Resolve the tab to activate after closing `closedId`, using the COMBINED
 * visual tab order (req 2.2 / C4).
 *
 * The visual tab bar interleaves three tab kinds:
 *   [ pinned Events (id=null), ...additional Events tabs, ...Dashboard tabs ]
 * whereas `useSessionManager.openTabs` only holds the pinned tab plus Dashboard
 * tabs. Picking a neighbor by a positional index into that PARTIAL array
 * activates the wrong tab whenever additional Events tabs sit between the pinned
 * tab and the first Dashboard tab. Resolving from the full combined order fixes
 * that: the neighbor is the tab immediately to the LEFT of the closed one, or
 * the tab to the RIGHT when the closed tab was first, falling back to the pinned
 * Events tab (null) when nothing else remains.
 *
 * Pure and identity-based (no positional index into a partial array): compares
 * ids with `null` normalization so the pinned Events tab (id=null) is handled
 * uniformly.
 *
 * @param {Array<{id: (string|null)}>} combinedTabOrder – full visual order
 * @param {string|null} closedId – id of the tab being closed
 * @returns {string|null} the id to activate, or null for the pinned Events tab
 */
export function resolveTabNeighbor(combinedTabOrder, closedId) {
  const order = Array.isArray(combinedTabOrder) ? combinedTabOrder : []
  const norm = (id) => (id == null ? null : id)
  const idx = order.findIndex((tab) => norm(tab?.id) === norm(closedId))
  // Unknown id → no neighbor to resolve; caller keeps current active tab.
  if (idx === -1) return null

  // Prefer the left neighbor; when the closed tab is first (idx 0), take the
  // right neighbor. The pinned Events tab (null) is the guaranteed fallback.
  const left = idx > 0 ? order[idx - 1] : null
  const right = idx < order.length - 1 ? order[idx + 1] : null
  const neighbor = left ?? right
  return neighbor ? norm(neighbor.id) : null
}
