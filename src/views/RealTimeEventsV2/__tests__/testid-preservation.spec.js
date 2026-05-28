import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Task 13.5 — Property P5: data-testid preservation
 *
 * Source-level guard that prevents accidental removal/rename of critical
 * `data-testid` attributes consumed by E2E suites and new responsive flows.
 *
 * Why a source-level grep (not a mounted-component query):
 *  - Some test-ids live inside conditionally rendered branches (bottom sheet,
 *    mobile-only refresh button) that are easy to silently break in a render
 *    test if the trigger conditions drift.
 *  - We want a contract assertion: "this attribute must exist in the file",
 *    independent of when/how it renders.
 *
 * If any case here fails, an upstream task removed or renamed a test-id.
 * Do NOT relax the assertion — fix the source.
 */

const repoRoot = path.resolve(__dirname, '../../../..')
const read = (relPath) => readFileSync(path.resolve(repoRoot, relPath), 'utf-8')

describe('Property P5 — data-testid preservation', () => {
  const cases = [
    // event-chart.vue — E2E suite + new bottom-sheet (req 5.1)
    {
      file: 'src/views/RealTimeEventsV2/Blocks/components/event-chart.vue',
      testid: 'event-chart'
    },
    {
      file: 'src/views/RealTimeEventsV2/Blocks/components/event-chart.vue',
      testid: 'event-chart-view'
    },
    {
      file: 'src/views/RealTimeEventsV2/Blocks/components/event-chart.vue',
      testid: 'rte-chart-bottom-sheet'
    },
    {
      file: 'src/views/RealTimeEventsV2/Blocks/components/event-chart.vue',
      testid: 'rte-chart-bottom-sheet-close'
    },
    {
      file: 'src/views/RealTimeEventsV2/Blocks/components/event-chart.vue',
      testid: 'rte-chart-bottom-sheet-backdrop'
    },

    // filter-bar.vue — E2E suite + new wrapper id (req 7.1)
    {
      file: 'src/views/RealTimeEventsV2/Blocks/components/filter-bar.vue',
      testid: 'dataset-selector-top'
    },
    {
      file: 'src/views/RealTimeEventsV2/Blocks/components/filter-bar.vue',
      testid: 'rte-filter-bar'
    },

    // TabsView.vue — E2E suite (session toolbar + buttons)
    {
      file: 'src/views/RealTimeEventsV2/TabsView.vue',
      testid: 'session-toolbar'
    },
    {
      file: 'src/views/RealTimeEventsV2/TabsView.vue',
      testid: 'open-session-browser-button'
    },
    {
      file: 'src/views/RealTimeEventsV2/TabsView.vue',
      testid: 'share-current-view-button'
    },

    // field-sidebar.vue — E2E suite
    {
      file: 'src/views/RealTimeEventsV2/Blocks/components/field-sidebar.vue',
      testid: 'field-sidebar'
    },

    // filterTagsDisplay/index.vue — new chips a11y (req 7.2)
    {
      file: 'src/components/base/advanced-filter-system-v2/filterTagsDisplay/index.vue',
      testid: 'rte-chips-scroll-container'
    },
    {
      file: 'src/components/base/advanced-filter-system-v2/filterTagsDisplay/index.vue',
      testid: 'rte-chip-remove-button'
    },

    // advanced-filter-system-v2/index.vue — new refresh button (req 9.1)
    {
      file: 'src/components/base/advanced-filter-system-v2/index.vue',
      testid: 'rte-refresh-button'
    }
  ]

  for (const { file, testid } of cases) {
    it(`${file} contains data-testid="${testid}"`, () => {
      const source = read(file)
      // Match data-testid="<id>", data-testid='<id>', data-testid=`<id>`,
      // and bound forms like :data-testid="'<id>'" or :data-testid="`<id>`".
      const pattern = new RegExp(`data-testid\\s*=\\s*["'\`]${testid}["'\`]`)
      expect(source, `Missing data-testid="${testid}" in ${file}`).toMatch(pattern)
    })
  }
})
