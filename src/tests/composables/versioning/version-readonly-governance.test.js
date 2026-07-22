// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../')
const read = (relative) => readFileSync(resolve(REPO_ROOT, relative), 'utf8')

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

    const shell = read('src/templates/version-shell-block/use-version-shell.js')
    expect(shell).toMatch(/readOnly\s*=\s*computed\(\(\)\s*=>\s*!isEditable\(state\.value\)\)/)
  })

  it.each(VERSIONED_FORM_COMPONENTS)('%s consumes the central readOnly flag', (file) => {
    const src = read(file)
    expect(src, `${file} must import useVersionContext`).toContain('useVersionContext')
    expect(src, `${file} must reference readOnly`).toContain('readOnly')
  })
})
