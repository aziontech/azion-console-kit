/**
 * Coverage-matrix claims (spec versioning-test-coverage / TEST-ARCHITECTURE §3.4).
 * The matrix (tests/coverage-matrix.json) is DERIVED from these markers —
 * run `node scripts/check-coverage-matrix.mjs --write` after changing them.
 * @covers network_list:J1 component partial
 * @covers network_list:J4 component
 * @covers network_list:J5 component partial
 */
import { afterEach, describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { httpService } from '@/services/v2/base/http/httpService'
import { queryClient } from '@/services/v2/base/query/queryClient'
import {
  createVersionCommandBus,
  VERSION_COMMAND_BUS_KEY
} from '@/composables/versioning/use-version-command-bus'
import { VERSION_CONTEXT_KEY } from '@/composables/versioning/use-version-context'

import NetworkListVersionAdapter from '@/views/NetworkLists/v6/NetworkListVersionAdapter.vue'

const NL_URL = 'v4/workspace/network_lists/10/versions/v1'

let requestSpy
const countReq = (method, urlPart) =>
  requestSpy.mock.calls
    .map(([req]) => req)
    .filter((req) => req.method === method && req.url.includes(urlPart)).length

const VALID_RESOURCE = {
  name: 'my-list',
  networkListType: 'ip_cidr',
  itemsValues: '10.0.0.0/24'
}

const makeContext = (overrides = {}) => ({
  state: ref('draft'),
  readOnly: ref(false),
  version: ref({ id: 'v1', config: {} }),
  availableActions: ref([]),
  disabledActions: ref([]),
  isVersioned: ref(true),
  dispatch: vi.fn(),
  ...overrides
})

const mountAdapter = ({ bus, resource = VALID_RESOURCE, context = makeContext(), slot } = {}) =>
  mount(NetworkListVersionAdapter, {
    props: { resource, resourceId: '10', versionId: 'v1' },
    slots: { default: slot ?? '<div data-testid="form-fields" />' },
    global: {
      provide: {
        [VERSION_COMMAND_BUS_KEY]: bus,
        [VERSION_CONTEXT_KEY]: context
      }
    }
  })

beforeEach(() => {
  vi.spyOn(queryClient, 'removeQueries').mockImplementation(() => {})
  vi.spyOn(queryClient, 'invalidateQueries').mockImplementation(() => {})
  requestSpy = vi
    .spyOn(httpService, 'request')
    .mockResolvedValue({ data: { version_id: 'v2', state: 'draft' } })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('NetworkListVersionAdapter — thin adapter delegating to useVersionFormAdapter', () => {
  it('renders the default slot and stays thin (template is just <slot/>)', () => {
    const bus = createVersionCommandBus()
    const wrapper = mountAdapter({ bus })
    expect(wrapper.find('[data-testid="form-fields"]').exists()).toBe(true)
  })

  it('SAVE PATCHes the draft; SAVE_AND_BUILD PATCHes then POSTs /build (default strategy)', async () => {
    const bus = createVersionCommandBus()
    mountAdapter({ bus })
    await flushPromises()

    await bus.emit('SAVE', { resourceId: '10', versionId: 'v1' })
    expect(requestSpy).toHaveBeenCalledWith({
      method: 'PATCH',
      url: NL_URL,
      body: expect.objectContaining({ name: 'my-list' })
    })
    expect(countReq('POST', '/build')).toBe(0)

    await bus.emit('SAVE_AND_BUILD', { comment: 'ship it' })
    expect(countReq('PATCH', NL_URL)).toBe(2)
    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      url: `${NL_URL}/build`,
      body: { comment: 'ship it' }
    })
  })

  it('SAVE with invalid form rejects and never issues a write request', async () => {
    const bus = createVersionCommandBus()
    mountAdapter({ bus, resource: { ...VALID_RESOURCE, name: '' } })
    await flushPromises()

    await expect(bus.emit('SAVE', { resourceId: '10', versionId: 'v1' })).rejects.toThrow()
    expect(countReq('PATCH', NL_URL)).toBe(0)
    expect(countReq('POST', '/build')).toBe(0)
  })

  it('NEW_DRAFT_FROM POSTs the clone and returns the normalized new draft', async () => {
    const bus = createVersionCommandBus()
    mountAdapter({ bus })
    await flushPromises()

    const draft = await bus.emit('NEW_DRAFT_FROM', {
      resourceId: '10',
      versionId: 'v1',
      comment: 'clone'
    })
    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      url: 'v4/workspace/network_lists/10/versions',
      body: expect.objectContaining({ source_version: 'v1', comment: 'clone' })
    })
    expect(draft.id).toBe('v2')
  })

  it('ARCHIVE / CANCEL_BUILD / DELETE hit their endpoints', async () => {
    const bus = createVersionCommandBus()
    mountAdapter({ bus })
    await flushPromises()

    await bus.emit('ARCHIVE', { resourceId: '10', versionId: 'v1', comment: 'done' })
    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      url: `${NL_URL}/archive`,
      body: { comment: 'done' }
    })

    await bus.emit('CANCEL_BUILD', { resourceId: '10', versionId: 'v1', comment: 'stop' })
    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      url: `${NL_URL}/cancel`,
      body: { comment: 'stop' }
    })

    await bus.emit('DELETE', { resourceId: '10', versionId: 'v1' })
    expect(requestSpy).toHaveBeenCalledWith({ method: 'DELETE', url: NL_URL })
  })
})

describe('NetworkListVersionAdapter — read-only disables the form in an immutable state', () => {
  const NameFieldStub = defineComponent({
    name: 'name-field',
    inject: { versionCtx: { from: VERSION_CONTEXT_KEY } },
    template: '<input data-testid="name-field" :data-disabled="String(disabled)" />',
    computed: {
      disabled() {
        return Boolean(this.versionCtx?.readOnly?.value)
      }
    }
  })

  const FormFieldsStub = defineComponent({
    name: 'form-fields',
    components: { NameFieldStub },
    template: '<div><name-field-stub /></div>'
  })

  const disabledOf = (wrapper) =>
    wrapper.get('[data-testid="name-field"]').attributes('data-disabled')

  it('keeps the form editable in a mutable draft (readOnly=false)', () => {
    const bus = createVersionCommandBus()
    const wrapper = mountAdapter({
      bus,
      context: makeContext({ readOnly: ref(false) }),
      slot: () => h(FormFieldsStub)
    })
    expect(disabledOf(wrapper)).toBe('false')
  })

  it('disables the form when the version is immutable (readOnly=true)', () => {
    const bus = createVersionCommandBus()
    const wrapper = mountAdapter({
      bus,
      context: makeContext({ readOnly: ref(true) }),
      slot: () => h(FormFieldsStub)
    })
    expect(disabledOf(wrapper)).toBe('true')
  })
})

describe('NetworkListVersionAdapter — thin (source-level P4 contract)', () => {
  const __dirname = dirname(fileURLToPath(import.meta.url))
  const adapterPath = resolve(
    __dirname,
    '../../../../views/NetworkLists/v6/NetworkListVersionAdapter.vue'
  )
  const source = readFileSync(adapterPath, 'utf-8')

  it('is <= 35 lines', () => {
    const lines = source.replace(/\n$/, '').split('\n')
    expect(lines.length).toBeLessThanOrEqual(35)
  })

  it('renders only a passthrough <slot /> (no inline form markup)', () => {
    const template = source.match(/<template>([\s\S]*?)<\/template>/)?.[1] ?? ''
    expect(template.trim()).toBe('<slot />')
  })

  it('delegates the lifecycle to useVersionFormAdapter with the shared specializations', () => {
    expect(source).toContain('useVersionFormAdapter')
    expect(source).toContain('networkListVersionService')
    expect(source).toContain('validationSchema')
    expect(source).toContain('defaultSaveStrategy')
  })

  it('registers no lifecycle handlers inline (the bus wiring lives in the composable)', () => {
    expect(source).not.toMatch(/onVersionCommand/)
    expect(source).not.toMatch(/SAVE_AND_BUILD/)
    expect(source).not.toMatch(/NEW_DRAFT_FROM/)
  })
})
