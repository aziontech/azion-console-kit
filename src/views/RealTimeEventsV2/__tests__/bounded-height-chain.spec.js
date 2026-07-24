import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

/**
 * Regression guard for task 15.5 (app-verify): the RTE v2 page grew to ~15,000px
 * because the virtualized `.virtual-table-viewport` (height:100%) had NO
 * bounded-height ancestor, so it expanded to the full content height and defeated
 * virtualization.
 *
 * The fix restores a bounded-height chain from the ContentBlock full-height mode
 * down to the table viewport. jsdom does no layout, so this is a SOURCE-LEVEL
 * assertion (same approach as testid-preservation.spec.js): it pins the exact
 * CSS/markers that make the chain bounded, so removing any link fails loudly
 * rather than silently reintroducing the tall-page regression.
 *
 * The chain (each link must stay present):
 *   ContentBlock `fillHeight` (propagates min-height:0)  ── TabsView.vue
 *   → tab-content region is a bounded flex column        ── TabsView.vue
 *   → tab panel root is flex-1 min-h-0                    ── tab-panel-block.vue
 *   → table scroll area is flex:1; min-height:0          ── VirtualEventTable.vue
 *   → viewport is height:100%; overflow:auto             ── VirtualEventTable.vue
 */
const here = dirname(fileURLToPath(import.meta.url))
// eslint-disable-next-line security/detect-non-literal-fs-filename -- reads repo-local source fixtures via __dirname
const read = (rel) => readFileSync(resolve(here, rel), 'utf8')

describe('RTE v2 bounded-height chain (task 15.5 regression guard)', () => {
  it('TabsView opts ContentBlock into fillHeight (propagates a bounded height)', () => {
    const tabsView = read('../TabsView.vue')
    expect(tabsView).toMatch(/<ContentBlock\b[^>]*\bfillHeight\b/)
  })

  it('TabsView tab-content region is a bounded flex column around KeepAlive', () => {
    const tabsView = read('../TabsView.vue')
    // The wrapper around <KeepAlive> must be flex + flex-1 + flex-col + min-h-0
    // (min-h-0 is what lets it shrink below content so the child scrolls).
    const wrapper = tabsView.match(/<div class="mt-3[^"]*"/)?.[0] ?? ''
    expect(wrapper).toContain('flex')
    expect(wrapper).toContain('flex-1')
    expect(wrapper).toContain('flex-col')
    expect(wrapper).toContain('min-h-0')
  })

  it('tab-panel-block root is flex-1 min-h-0 (fills the bounded height)', () => {
    const tabPanel = read('../Blocks/tab-panel-block.vue')
    expect(tabPanel).toMatch(/class="flex flex-col flex-1 min-h-0/)
  })

  it('VirtualEventTable scroll area is bounded (flex:1; min-height:0) and viewport scrolls internally', () => {
    const table = read('../Blocks/components/VirtualEventTable.vue')
    // The scroll-area container must be a shrinkable flex child…
    expect(table).toMatch(/\.discover-table-scroll-area\s*\{[^}]*flex:\s*1[^}]*min-height:\s*0/s)
    // …and the viewport itself owns the internal scroll (height:100% + overflow:auto).
    expect(table).toMatch(/\.virtual-table-viewport\s*\{[^}]*height:\s*100%[^}]*overflow:\s*auto/s)
  })
})
