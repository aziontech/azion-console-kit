import { afterEach, describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import * as yup from 'yup'
import { httpService } from '@/services/v2/base/http/httpService'
import { queryClient } from '@/services/v2/base/query/queryClient'
import { setFeatureFlags } from '@/composables/user-flag'
import {
  createVersionCommandBus,
  VERSION_COMMAND_BUS_KEY
} from '@/composables/versioning/use-version-command-bus'
import { VERSION_CONTEXT_KEY } from '@/composables/versioning/use-version-context'

const { customPageBaseService } = vi.hoisted(() => ({
  customPageBaseService: { editCustomPagesService: null }
}))

vi.mock('@/services/v2/custom-page/custom-page-service', () => ({
  customPageService: customPageBaseService
}))

vi.mock('@/views/CustomPages/Config/validationSchema', () => ({ validationSchema: yup.object({}) }))
vi.mock('@/views/Workload/Config/validation', () => ({ buildV6Schema: () => yup.object({}) }))

import ApplicationVersionAdapter from '@/views/EdgeApplications/v6/ApplicationVersionAdapter.vue'
import FirewallVersionAdapter from '@/views/EdgeFirewall/v6/FirewallVersionAdapter.vue'
import CustomPageVersionAdapter from '@/views/CustomPages/v6/CustomPageVersionAdapter.vue'
import WorkloadVersionAdapter from '@/views/Workload/v6/WorkloadVersionAdapter.vue'

const mountAdapter = (component, bus, resource = { name: 'res-x' }) =>
  mount(component, {
    props: { resource, resourceId: '10', versionId: 'v1' },
    slots: { default: '<div data-testid="form-fields" />' },
    global: {
      provide: {
        [VERSION_COMMAND_BUS_KEY]: bus,
        [VERSION_CONTEXT_KEY]: {
          state: ref('draft'),
          readOnly: ref(false),
          version: ref({ id: 'v1', config: {} }),
          availableActions: ref([]),
          disabledActions: ref([]),
          isVersioned: ref(true),
          dispatch: vi.fn()
        }
      }
    }
  })

let requestSpy

const requests = () => requestSpy.mock.calls.map(([req]) => req)
const countReq = (method, urlPart) =>
  requests().filter((req) => req.method === method && req.url.includes(urlPart)).length

beforeEach(() => {
  vi.spyOn(queryClient, 'removeQueries').mockImplementation(() => {})
  vi.spyOn(queryClient, 'invalidateQueries').mockImplementation(() => {})
  requestSpy = vi
    .spyOn(httpService, 'request')
    .mockResolvedValue({ data: { version_id: 'v1', state: 'draft' } })
  customPageBaseService.editCustomPagesService = vi.fn().mockResolvedValue({ id: 10 })
})

afterEach(() => {
  vi.restoreAllMocks()
  setFeatureFlags([])
})

const workloadResource = {
  name: 'res-x',
  active: true,
  infrastructure: 1,
  domains: [],
  protocols: {
    http: { useHttp3: false, useHttps: false, httpPorts: [], httpsPorts: [], quicPorts: [] }
  },
  mtls: { isEnabled: false, verification: null, certificate: null, crl: null },
  environmentDeployments: {},
  workloadHostnameAllowAccess: true
}

describe('useVersionFormAdapter — shared lifecycle handlers across resources', () => {
  it('Application: SAVE PATCHes the draft; SAVE_AND_BUILD PATCHes then POSTs /build', async () => {
    const bus = createVersionCommandBus()
    mountAdapter(ApplicationVersionAdapter, bus)
    await flushPromises()

    await bus.emit('SAVE', { resourceId: '10', versionId: 'v1' })
    expect(requestSpy).toHaveBeenCalledWith({
      method: 'PATCH',
      url: 'v4/workspace/applications/10/versions/v1',
      body: expect.objectContaining({ name: 'res-x' })
    })
    expect(countReq('POST', '/build')).toBe(0)

    await bus.emit('SAVE_AND_BUILD', { comment: 'ship it' })
    expect(countReq('PATCH', 'v4/workspace/applications/10/versions/v1')).toBe(2)
    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      url: 'v4/workspace/applications/10/versions/v1/build',
      body: { comment: 'ship it' }
    })
  })

  it('Application: ARCHIVE / CANCEL_BUILD / NEW_DRAFT_FROM / DELETE hit their endpoints', async () => {
    const bus = createVersionCommandBus()
    mountAdapter(ApplicationVersionAdapter, bus)
    await flushPromises()

    await bus.emit('ARCHIVE', { resourceId: '10', versionId: 'v1', comment: 'done' })
    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      url: 'v4/workspace/applications/10/versions/v1/archive',
      body: { comment: 'done' }
    })

    await bus.emit('CANCEL_BUILD', { resourceId: '10', versionId: 'v1', comment: 'stop' })
    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      url: 'v4/workspace/applications/10/versions/v1/cancel',
      body: { comment: 'stop' }
    })

    await bus.emit('NEW_DRAFT_FROM', { resourceId: '10', versionId: 'v1', comment: 'clone' })
    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      url: 'v4/workspace/applications/10/versions',
      body: expect.objectContaining({ source_version: 'v1', comment: 'clone' })
    })

    await bus.emit('DELETE', { resourceId: '10', versionId: 'v1' })
    expect(requestSpy).toHaveBeenCalledWith({
      method: 'DELETE',
      url: 'v4/workspace/applications/10/versions/v1'
    })
  })

  it('Firewall: SAVE_AND_BUILD PATCHes then POSTs /build (default strategy)', async () => {
    const bus = createVersionCommandBus()
    mountAdapter(FirewallVersionAdapter, bus)
    await flushPromises()

    await bus.emit('SAVE_AND_BUILD', { comment: 'go' })
    expect(requestSpy).toHaveBeenCalledWith({
      method: 'PATCH',
      url: 'v4/workspace/firewalls/10/versions/v1',
      body: expect.objectContaining({ name: 'res-x' })
    })
    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      url: 'v4/workspace/firewalls/10/versions/v1/build',
      body: { comment: 'go' }
    })
  })

  it('Custom Page: SAVE hits the BASE endpoint (10109), NOT the version PATCH', async () => {
    const bus = createVersionCommandBus()
    mountAdapter(CustomPageVersionAdapter, bus)
    await flushPromises()

    await bus.emit('SAVE', { resourceId: '10', versionId: 'v1' })
    expect(customPageBaseService.editCustomPagesService).toHaveBeenCalledWith(
      expect.objectContaining({ id: '10', name: 'res-x' })
    )
    expect(countReq('PATCH', 'v4/workspace/custom_pages/10/versions/v1')).toBe(0)

    await bus.emit('SAVE_AND_BUILD', { comment: 'publish' })
    expect(customPageBaseService.editCustomPagesService).toHaveBeenCalledTimes(2)
    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      url: 'v4/workspace/custom_pages/10/versions/v1/build',
      body: { comment: 'publish' }
    })
    expect(countReq('PATCH', 'v4/workspace/custom_pages/10/versions/v1')).toBe(0)
  })

  it('Workload: SAVE and SAVE_AND_BUILD both PUT/PATCH the draft with NO separate build', async () => {
    setFeatureFlags(['use_v6_configurations'])
    const bus = createVersionCommandBus()
    mountAdapter(WorkloadVersionAdapter, bus, workloadResource)
    await flushPromises()

    await bus.emit('SAVE', { resourceId: '10', versionId: 'v1' })
    await bus.emit('SAVE_AND_BUILD', { comment: 'auto' })

    expect(countReq('PATCH', 'v4/workspace/workloads/10/versions/v1')).toBe(2)
    expect(countReq('POST', '/build')).toBe(0)
  })
})
