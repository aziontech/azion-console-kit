// ────────────────────────────────────────────────────────────────────────────
// BUCKET-SIZING concern — viewport-aware soft cap on bar count.
//
// Extracted from useChartBuilder.js (task 7.5). Lives in its own module because
// both the pivot concern (bucket count per breakpoint) and the public builder
// API consume it; keeping it standalone avoids a config↔pivot import cycle.
// ────────────────────────────────────────────────────────────────────────────

// Soft cap on bar count per viewport breakpoint. Anything denser than these
// values produces bars under ~10px wide, which the human eye merges into a
// single blob. The cap drives `getBucketInterval` to pick a coarser bucket
// (e.g. 30s instead of 5s) on narrow viewports, restoring readability.
// Exported so consumers can verify the contract and so the bundler keeps the
// symbol around even under aggressive tree-shaking.
export const BUCKETS_PER_BREAKPOINT = {
  'mobile-s': 24,
  mobile: 32,
  tablet: 60,
  desktop: 120,
  xl: 180
}

export function bucketsForBreakpoint(breakpoint) {
  return BUCKETS_PER_BREAKPOINT[breakpoint] || BUCKETS_PER_BREAKPOINT.desktop
}
