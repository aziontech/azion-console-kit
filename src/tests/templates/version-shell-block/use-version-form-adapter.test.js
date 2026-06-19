import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import * as yup from 'yup'
import {
  createVersionCommandBus,
  VERSION_COMMAND_BUS_KEY
} from '@/composables/versioning/use-version-command-bus'
import { VERSION_CONTEXT_KEY } from '@/composables/versioning/use-version-context'

// One mock object per resource service; each method is a spy resolving a version.
const makeServiceMock = () => ({
  updateDraft: vi.fn().mockResolvedValue({ id: 'v1' }),
  build: vi.fn().mockResolvedValue(undefined),
  archive: vi.fn().mockResolvedValue(undefined),
  cancelBuild: vi.fn().mockResolvedValue(undefined),
  createDraft: vi.fn().mockResolvedValue({ id: 'v2' }),
  deleteVersion: vi.fn().mockResolvedValue(undefined)
})

const {
  appService,
  firewallService,
  customPageVersionService,
  customPageBaseService,
  workloadService
} = vi.hoisted(() => ({
  appService: {
    updateDraft: null,
    build: null,
    archive: null,
    cancelBuild: null,
    createDraft: null,
    deleteVersion: null
  },
  firewallService: {},
  customPageVersionService: {},
  customPageBaseService: { editCustomPagesService: null },
  workloadService: {}
}))

vi.mock('@/services/v2/edge-app/edge-app-version-service', () => ({
  edgeAppVersionService: appService
}))
vi.mock('@/services/v2/edge-firewall/edge-firewall-version-service', () => ({
  edgeFirewallVersionService: firewallService
}))
vi.mock('@/services/v2/custom-page/custom-page-version-service', () => ({
  customPageVersionService
}))
vi.mock('@/services/v2/custom-page/custom-page-service', () => ({
  customPageService: customPageBaseService
}))
vi.mock('@/services/v2/workload/workload-version-service', () => ({
  workloadVersionService: workloadService
}))

// Keep imported schemas trivial so validate() passes and the test isolates the
// save routing (App/Firewall declare their own inline schema requiring `name`).
vi.mock('@/views/CustomPages/Config/validationSchema', () => ({ validationSchema: yup.object({}) }))
vi.mock('@/views/Workload/Config/validation', () => ({ buildV6Schema: () => yup.object({}) }))

import ApplicationVersionAdapter from '@/views/EdgeApplications/v6/ApplicationVersionAdapter.vue'
import FirewallVersionAdapter from '@/views/EdgeFirewall/v6/FirewallVersionAdapter.vue'
import CustomPageVersionAdapter from '@/views/CustomPages/v6/CustomPageVersionAdapter.vue'
import WorkloadVersionAdapter from '@/views/Workload/v6/WorkloadVersionAdapter.vue'

const mountAdapter = (component, bus) =>
  mount(component, {
    props: { resource: { name: 'res-x' }, resourceId: '10', versionId: 'v1' },
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

beforeEach(() => {
  Object.assign(appService, makeServiceMock())
  Object.assign(firewallService, makeServiceMock())
  Object.assign(customPageVersionService, makeServiceMock())
  Object.assign(workloadService, makeServiceMock())
  customPageBaseService.editCustomPagesService = vi.fn().mockResolvedValue({ id: 10 })
})

describe('useVersionFormAdapter — shared lifecycle handlers across resources', () => {
  it('Application: SAVE updates the draft; SAVE_AND_BUILD updates then builds', async () => {
    const bus = createVersionCommandBus()
    mountAdapter(ApplicationVersionAdapter, bus)
    await flushPromises()

    await bus.emit('SAVE', { resourceId: '10', versionId: 'v1' })
    expect(appService.updateDraft).toHaveBeenCalledWith(
      '10',
      'v1',
      expect.objectContaining({ name: 'res-x' })
    )
    expect(appService.build).not.toHaveBeenCalled()

    await bus.emit('SAVE_AND_BUILD', { comment: 'ship it' })
    expect(appService.updateDraft).toHaveBeenCalledTimes(2)
    expect(appService.build).toHaveBeenCalledWith('10', 'v1', { comment: 'ship it' })
  })

  it('Application: ARCHIVE / CANCEL_BUILD / NEW_DRAFT_FROM / DELETE route to the service', async () => {
    const bus = createVersionCommandBus()
    mountAdapter(ApplicationVersionAdapter, bus)
    await flushPromises()

    await bus.emit('ARCHIVE', { resourceId: '10', versionId: 'v1', comment: 'done' })
    expect(appService.archive).toHaveBeenCalledWith('10', 'v1', { comment: 'done' })

    await bus.emit('CANCEL_BUILD', { resourceId: '10', versionId: 'v1', comment: 'stop' })
    expect(appService.cancelBuild).toHaveBeenCalledWith('10', 'v1', { comment: 'stop' })

    await bus.emit('NEW_DRAFT_FROM', { resourceId: '10', versionId: 'v1', comment: 'clone' })
    expect(appService.createDraft).toHaveBeenCalledWith('10', {
      sourceVersionId: 'v1',
      comment: 'clone'
    })

    await bus.emit('DELETE', { resourceId: '10', versionId: 'v1' })
    expect(appService.deleteVersion).toHaveBeenCalledWith('10', 'v1')
  })

  it('Firewall: SAVE_AND_BUILD updates then builds (default strategy)', async () => {
    const bus = createVersionCommandBus()
    mountAdapter(FirewallVersionAdapter, bus)
    await flushPromises()

    await bus.emit('SAVE_AND_BUILD', { comment: 'go' })
    expect(firewallService.updateDraft).toHaveBeenCalledWith(
      '10',
      'v1',
      expect.objectContaining({ name: 'res-x' })
    )
    expect(firewallService.build).toHaveBeenCalledWith('10', 'v1', { comment: 'go' })
  })

  it('Custom Page: SAVE hits the BASE endpoint (10109), NOT the version updateDraft', async () => {
    const bus = createVersionCommandBus()
    mountAdapter(CustomPageVersionAdapter, bus)
    await flushPromises()

    await bus.emit('SAVE', { resourceId: '10', versionId: 'v1' })
    expect(customPageBaseService.editCustomPagesService).toHaveBeenCalledWith(
      expect.objectContaining({ id: '10', name: 'res-x' })
    )
    expect(customPageVersionService.updateDraft).not.toHaveBeenCalled()

    await bus.emit('SAVE_AND_BUILD', { comment: 'publish' })
    expect(customPageBaseService.editCustomPagesService).toHaveBeenCalledTimes(2)
    expect(customPageVersionService.build).toHaveBeenCalledWith('10', 'v1', { comment: 'publish' })
    expect(customPageVersionService.updateDraft).not.toHaveBeenCalled()
  })

  it('Workload: SAVE and SAVE_AND_BUILD both PUT the draft with NO separate build', async () => {
    const bus = createVersionCommandBus()
    mountAdapter(WorkloadVersionAdapter, bus)
    await flushPromises()

    await bus.emit('SAVE', { resourceId: '10', versionId: 'v1' })
    await bus.emit('SAVE_AND_BUILD', { comment: 'auto' })

    expect(workloadService.updateDraft).toHaveBeenCalledTimes(2)
    expect(workloadService.build).not.toHaveBeenCalled()
  })
})
