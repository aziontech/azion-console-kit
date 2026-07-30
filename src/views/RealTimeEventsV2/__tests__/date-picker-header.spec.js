import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Task 13.10 (BUG5) — date-picker calendar header: "Set Now" / month nav must
 * not overlap the `< >` navigation, and the calendar must use the
 * `@aziontech/webkit` Calendar component (not custom overlapping markup).
 *
 * Historical bug (see recon bug5DatePicker): the picker previously rendered
 *   1. quick-range `< >` chevrons as `position: absolute` OVERLAYING the
 *      TabView nav ("Quick/Absolute/Relative/Now"), so the "Now" tab label
 *      sat under the chevrons at narrow OverlayPanel widths; and
 *   2. a CUSTOM Absolute-mode calendar header (custom `pi pi-chevron-*`
 *      buttons + month/year Dropdowns) while the webkit `<Calendar>` native
 *      header was suppressed via `:pt="{ header: { class: 'hidden' } }"`.
 *
 * Both were fixed by migrating to the webkit Calendar with its native
 * (non-overlapping) header and moving the quick-range chevrons into the
 * normal flex flow of the Quick tab panel (never co-rendered with the
 * "Now" tab, so no overlap is possible at any width).
 *
 * Why a source-level guard (not a mounted-component query):
 *  - The overlap was a CSS/layout regression (absolute positioning, hidden
 *    header) that JSDOM does not compute (no real layout engine), so a mount
 *    test cannot observe the overlap. A source contract is the reliable seam.
 *  - This locks in the corrected structure so a future edit cannot silently
 *    reintroduce the absolute-positioned nav or re-hide the webkit header.
 *
 * If any case here fails, an upstream change reintroduced the overlap-prone
 * markup. Do NOT relax the assertion — fix the source.
 *
 * **Validates: BUG5 (date-picker header overlap) — design §7 / task 13.10.**
 */

const repoRoot = path.resolve(__dirname, '../../../..')
// relPath is a hardcoded repo-source path from the test cases below, not user input.
// eslint-disable-next-line security/detect-non-literal-fs-filename
const read = (relPath) => readFileSync(path.resolve(repoRoot, relPath), 'utf-8')

const PICKER = 'src/components/base/dataTimeRange-v2/index.vue'
const INPUT_RANGE = 'src/components/base/dataTimeRange-v2/inputDateRange/index.vue'

describe('BUG5 — date-picker header does not overlap', () => {
  describe('Absolute-mode calendar uses the webkit Calendar component', () => {
    it('imports the calendar from @aziontech/webkit (design-system component, not custom)', () => {
      const source = read(INPUT_RANGE)
      expect(source).toMatch(/import\s+Calendar\s+from\s+['"]@aziontech\/webkit\/calendar['"]/)
    })

    it('renders the webkit <Calendar> in the absolute-mode panel', () => {
      const source = read(INPUT_RANGE)
      expect(source).toMatch(/<Calendar\b/)
    })

    it('does NOT hide the webkit Calendar native header (no header:{class:"hidden"})', () => {
      // Re-hiding the native header was the root cause of the custom
      // overlapping header. The native header lays out prev/next + month/year
      // without overlap, so it must stay visible.
      const source = read(INPUT_RANGE)
      expect(source).not.toMatch(/header\s*:\s*\{\s*class\s*:\s*['"][^'"]*hidden/)
    })

    it('does NOT render a custom prev/next month header alongside the Calendar', () => {
      // The old custom header paired pi-chevron-left/right buttons with
      // month/year dropdowns; the webkit native header replaces it.
      const source = read(INPUT_RANGE)
      expect(source).not.toMatch(/pi\s+pi-chevron-left/)
      expect(source).not.toMatch(/pi\s+pi-chevron-right/)
    })
  })

  describe('Quick-range navigation does not overlap the TabView nav', () => {
    it('does NOT position the quick-range chevrons absolutely over the tab header', () => {
      // The overlap came from `class="absolute right-0 top-0 z-10 ..."` on the
      // chevron group sitting on top of the TabView navcontent.
      const source = read(PICKER)
      expect(source).not.toMatch(/class="[^"]*absolute[^"]*right-0[^"]*top-0/)
    })

    it('keeps the quick-range chevrons inside the Quick tab panel (in normal flow)', () => {
      // Chevrons live in the Quick TabPanel and "Set Now" lives in the Now
      // TabPanel; they are never co-rendered, so no overlap is possible.
      const source = read(PICKER)
      expect(source).toMatch(/icon="pi pi-chevron-left"/)
      expect(source).toMatch(/icon="pi pi-chevron-right"/)
    })

    it('does NOT reserve overlap padding (pr-16 navcontent hack) for absolute chevrons', () => {
      // The old fix reserved room with `navcontent pr-16` only on the Quick
      // tab; with the chevrons in normal flow this hack is unnecessary and its
      // absence proves the absolute-overlay layout is gone.
      const source = read(PICKER)
      expect(source).not.toMatch(/navcontent\b[^}]*pr-16/)
    })
  })

  describe('no raw brand-hex focus ring in the picker surface', () => {
    it('does not hardcode the #F3652B brand orange (must use a design-system token)', () => {
      // Raw hex is a design-system build-breaker; the focus ring must use a
      // token (e.g. --primary-color / --border-selected).
      const picker = read(PICKER)
      const inputRange = read(INPUT_RANGE)
      expect(picker).not.toMatch(/#F3652B/i)
      expect(inputRange).not.toMatch(/#F3652B/i)
    })
  })
})
