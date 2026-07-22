import { defineComponent, h, ref } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve, dirname } from 'node:path'

import { VERSION_CONTEXT_KEY } from '@/composables/versioning/use-version-context'

vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@aziontech/webkit/use-dialog', () => ({ useDialog: () => ({ open: vi.fn() }) }))
vi.mock('@aziontech/webkit/use-toast', () => ({ useToast: () => ({ add: vi.fn() }) }))
vi.mock('@/composables/useDeleteDialog', () => ({
  useDeleteDialog: () => ({ openDeleteDialog: vi.fn() })
}))

import { useDataTable } from '@/composables/useDataTable'

const mountTable = (readOnly) => {
  const captured = {}
  const Harness = defineComponent({
    setup() {
      const api = useDataTable(
        {
          loadDisabled: true,
          actions: [{ label: 'Delete', type: 'delete' }],
          columns: [{ field: 'name', header: 'Name' }],
          rowsPerPageOptions: [10],
          expandedRowGroups: []
        },
        () => {}
      )
      captured.readOnly = api.readOnly
      captured.isRenderActions = api.isRenderActions
      return () => h('div')
    }
  })

  const wrapper = mount(Harness, {
    global: { provide: { [VERSION_CONTEXT_KEY]: { readOnly } } }
  })
  return { wrapper, captured }
}

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../')

const read = (relative) => readFileSync(resolve(ROOT, relative), 'utf8')

describe('useDataTable — read-only version drops row actions', () => {
  it('renders actions in an editable (draft) context', async () => {
    const { captured } = mountTable(ref(false))
    await flushPromises()
    expect(captured.readOnly.value).toBe(false)
    expect(captured.isRenderActions.value).toBe(true)
  })

  it('drops every row action in an immutable (ready) version', async () => {
    const { captured } = mountTable(ref(true))
    await flushPromises()
    expect(captured.readOnly.value).toBe(true)
    expect(captured.isRenderActions.value).toBe(false)
  })

  it('reacts when the version context toggles to immutable', async () => {
    const readOnly = ref(false)
    const { captured } = mountTable(readOnly)
    await flushPromises()
    expect(captured.isRenderActions.value).toBe(true)
    readOnly.value = true
    expect(captured.isRenderActions.value).toBe(false)
  })

  it('keeps actions when mounted outside a version shell (default readOnly=false)', async () => {
    const Harness = defineComponent({
      setup() {
        const api = useDataTable(
          { loadDisabled: true, actions: [{ label: 'Delete', type: 'delete' }] },
          () => {}
        )
        return () => h('div', { 'data-render': String(api.isRenderActions.value) })
      }
    })
    const wrapper = mount(Harness)
    await flushPromises()
    expect(wrapper.attributes('data-render')).toBe('true')
  })
})

describe('list table empty-state create button is gated globally', () => {
  it('ListTable strips the webkit fallback button and gates the slot on readOnly', () => {
    const src = read('src/components/list-table/ListTable.vue')
    expect(src).toContain('readOnly')
    expect(src).toContain('effectiveEmptyBlock')
    expect(src).toMatch(/:emptyBlock="effectiveEmptyBlock"/)
    expect(src).toMatch(/#emptyBlockButton[\s\S]*v-if="!readOnly"/)
  })

  it('useDataTable gates row actions on the central readOnly flag', () => {
    const src = read('src/composables/useDataTable.js')
    expect(src).toContain('useVersionContext')
    expect(src).toMatch(/if \(readOnly\.value\) return \[\]/)
  })

  it('EdgeFirewallRulesEngine gates its own empty-state button (bypasses ListTable)', () => {
    const src = read('src/views/EdgeFirewallRulesEngine/ListView.vue')
    expect(src).toMatch(/#emptyBlockButton[\s\S]*v-if="!isReadOnly"/)
  })
})
