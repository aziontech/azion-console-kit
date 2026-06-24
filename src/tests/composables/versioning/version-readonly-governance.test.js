import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/**
 * Governance — Version Shell readOnly (single source of truth).
 *
 * The "what is editable" RULE lives in exactly ONE place: version-machine.isEditable
 * (draft/canceled/error). The shell derives a single `readOnly` flag from it once
 * (use-version-shell) and provides it via the version context. Every versioned form
 * component must CONSUME that flag (useVersionContext + readOnly) so an immutable
 * version (ready/active/archived/queued/building) cannot be edited.
 *
 * This test fails if (a) the rule is duplicated/moved out of version-machine, or
 * (b) a versioned form stops consuming the central flag — the exact regression that
 * left Firewall/WAF/CustomPages/Functions editable while Ready.
 */
const read = (relative) =>
  readFileSync(fileURLToPath(new URL(`../../../../${relative}`, import.meta.url)), 'utf8')

// Form components rendered inside the version editors. Each MUST read the central
// readOnly flag. Listing a new versioned form here without consuming readOnly fails.
const VERSIONED_FORM_COMPONENTS = [
  'src/views/EdgeFirewall/FormFields/FormFieldsEdgeFirewall.vue',
  'src/views/WafRules/FormFields/FormFieldsWafRules.vue',
  'src/views/EdgeFunctions/FormFields/FormFieldsEditEdgeFunctions.vue',
  'src/views/EdgeFunctions/components/code-editor.vue',
  'src/views/NetworkLists/FormFields/FormFieldsEditNetworkLists.vue',
  'src/views/Workload/FormFields/FormFieldsWorkload.vue',
  'src/views/CustomPages/FormFields/CustomPages.vue',
  'src/views/CustomPages/Blocks/customPageBlock.vue',
  'src/views/CustomPages/Blocks/pagesCodeBlock.vue',
  'src/views/CustomPages/Blocks/statusConfigurationBlock.vue',
  'src/views/CustomPages/Blocks/responseDetailsBlock.vue',
  'src/views/CustomPages/Drawer/drawerSelectPageCode.vue'
]

describe('Version Shell readOnly — single rule, consumed by every versioned form', () => {
  it('the editable rule lives only in version-machine.isEditable', () => {
    const machine = read('src/composables/versioning/version-machine.js')
    expect(machine).toContain('export const isEditable')
    expect(machine).toContain("'draft'")
    expect(machine).toContain("'canceled'")
    expect(machine).toContain("'error'")

    // The shell derives readOnly from the rule once (not re-implemented per form).
    const shell = read('src/templates/version-shell-block/use-version-shell.js')
    expect(shell).toMatch(/readOnly\s*=\s*computed\(\(\)\s*=>\s*!isEditable\(state\.value\)\)/)
  })

  it.each(VERSIONED_FORM_COMPONENTS)('%s consumes the central readOnly flag', (file) => {
    const src = read(file)
    expect(src, `${file} must import useVersionContext`).toContain('useVersionContext')
    expect(src, `${file} must reference readOnly`).toContain('readOnly')
  })
})
