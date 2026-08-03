/**
 * Coverage-matrix claims (spec versioning-test-coverage / TEST-ARCHITECTURE §3.4).
 * The matrix (tests/coverage-matrix.json) is DERIVED from these markers —
 * run `node scripts/check-coverage-matrix.mjs --write` after changing them.
 * @covers function:J1 component partial
 * @covers function:J4 component
 * @covers function:J5 component partial
 */
import { afterEach, describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import { httpService } from '@/services/v2/base/http/httpService'
import { queryClient } from '@/services/v2/base/query/queryClient'
import {
  createVersionCommandBus,
  VERSION_COMMAND_BUS_KEY
} from '@/composables/versioning/use-version-command-bus'
import { VERSION_CONTEXT_KEY } from '@/composables/versioning/use-version-context'

import EdgeFunctionVersionAdapter from '@/views/EdgeFunctions/v6/EdgeFunctionVersionAdapter.vue'

const VALID_RESOURCE = { name: 'my-fn', code: 'export default {}', defaultArgs: '{}' }

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
  mount(EdgeFunctionVersionAdapter, {
    props: { resource, resourceId: '10', versionId: 'v1' },
    slots: { default: slot ?? '<div data-testid="form-fields" />' },
    global: {
      provide: {
        [VERSION_COMMAND_BUS_KEY]: bus,
        [VERSION_CONTEXT_KEY]: context
      }
    }
  })

const FN_URL = 'v4/workspace/functions/10/versions/v1'

let requestSpy
const countReq = (method, urlPart) =>
  requestSpy.mock.calls
    .map(([req]) => req)
    .filter((req) => req.method === method && req.url.includes(urlPart)).length

beforeEach(() => {
  vi.spyOn(queryClient, 'removeQueries').mockImplementation(() => {})
  vi.spyOn(queryClient, 'invalidateQueries').mockImplementation(() => {})
  requestSpy = vi
    .spyOn(httpService, 'request')
    .mockResolvedValue({ data: { version_id: 'v2', state: 'draft', name: 'cloned draft' } })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('EdgeFunctionVersionAdapter — thin adapter delegating to useVersionFormAdapter', () => {
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
      url: FN_URL,
      body: expect.objectContaining({ name: 'my-fn' })
    })
    expect(countReq('POST', '/build')).toBe(0)

    await bus.emit('SAVE_AND_BUILD', { comment: 'ship it' })
    expect(countReq('PATCH', FN_URL)).toBe(2)
    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      url: `${FN_URL}/build`,
      body: { comment: 'ship it' }
    })
  })

  it('SAVE with invalid form rejects and never issues a write request', async () => {
    const bus = createVersionCommandBus()
    mountAdapter({ bus, resource: { name: 'my-fn', code: '', defaultArgs: '{}' } })
    await flushPromises()

    await expect(bus.emit('SAVE', { resourceId: '10', versionId: 'v1' })).rejects.toThrow()
    expect(countReq('PATCH', FN_URL)).toBe(0)
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
      url: 'v4/workspace/functions/10/versions',
      body: expect.objectContaining({ source_version: 'v1', comment: 'clone' })
    })
    expect(draft.id).toBe('v2')
    expect(draft.config).toMatchObject({ name: 'cloned draft' })
  })

  it('ARCHIVE / CANCEL_BUILD / DELETE hit their endpoints', async () => {
    const bus = createVersionCommandBus()
    mountAdapter({ bus })
    await flushPromises()

    await bus.emit('ARCHIVE', { resourceId: '10', versionId: 'v1', comment: 'done' })
    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      url: `${FN_URL}/archive`,
      body: { comment: 'done' }
    })

    await bus.emit('CANCEL_BUILD', { resourceId: '10', versionId: 'v1', comment: 'stop' })
    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      url: `${FN_URL}/cancel`,
      body: { comment: 'stop' }
    })

    await bus.emit('DELETE', { resourceId: '10', versionId: 'v1' })
    expect(requestSpy).toHaveBeenCalledWith({ method: 'DELETE', url: FN_URL })
  })
})

describe('EdgeFunctionVersionAdapter — read-only in an immutable version state', () => {
  const CodeEditorStub = {
    name: 'code-editor',
    inject: { versionCtx: { from: VERSION_CONTEXT_KEY } },
    template:
      '<div data-testid="code-editor" :data-readonly="String(Boolean(versionCtx?.readOnly?.value))" />'
  }

  const FormFieldsStub = {
    name: 'form-fields',
    components: { CodeEditorStub },
    template: '<div><code-editor-stub /></div>'
  }

  const readonlyAttr = (wrapper) =>
    wrapper.get('[data-testid="code-editor"]').attributes('data-readonly')

  it('exposes an editable context by default (mutable draft)', () => {
    const bus = createVersionCommandBus()
    const wrapper = mountAdapter({
      bus,
      context: makeContext({ readOnly: ref(false) }),
      slot: FormFieldsStub
    })
    expect(readonlyAttr(wrapper)).toBe('false')
  })

  it('propagates readOnly to the form + code editor when the version is immutable', () => {
    const bus = createVersionCommandBus()
    const wrapper = mountAdapter({
      bus,
      context: makeContext({ readOnly: ref(true) }),
      slot: FormFieldsStub
    })
    expect(readonlyAttr(wrapper)).toBe('true')
  })
})
