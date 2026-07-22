import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { versionedCacheSettingsService } from '@/services/v2/edge-app/versioned/versioned-cache-settings-service'
import { versionedDeviceGroupService } from '@/services/v2/edge-app/versioned/versioned-device-group-service'
import { versionedFunctionService } from '@/services/v2/edge-app/versioned/versioned-function-service'
import { versionedRulesEngineService } from '@/services/v2/edge-app/versioned/versioned-rules-engine-service'
import { useVersionedFacades } from '@/views/EdgeApplications/v6/tabs/use-versioned-facades'

const RESOURCE_ID = 'app-1'
const VERSION_ID = 'v-9'
const IGNORED_APP_ID = 'live-app-999'

let facades

beforeEach(() => {
  facades = useVersionedFacades(RESOURCE_ID, VERSION_ID)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useVersionedFacades — cacheSettings (appId-leading facade)', () => {
  it('list(query) delegates as (resourceId, versionId, query)', () => {
    const spy = vi.spyOn(versionedCacheSettingsService, 'list').mockImplementation(() => {})
    facades.cacheSettings.list({ page: 1 })
    expect(spy).toHaveBeenCalledWith(RESOURCE_ID, VERSION_ID, { page: 1 })
  })

  it('load(edgeApplicationId, id) drops the leading id and delegates as (resourceId, versionId, id)', () => {
    const spy = vi.spyOn(versionedCacheSettingsService, 'load').mockImplementation(() => {})
    facades.cacheSettings.load(IGNORED_APP_ID, 55)
    expect(spy).toHaveBeenCalledWith(RESOURCE_ID, VERSION_ID, 55)
  })

  it('create(edgeApplicationId, payload) drops the leading id and delegates as (resourceId, versionId, payload)', () => {
    const spy = vi.spyOn(versionedCacheSettingsService, 'create').mockImplementation(() => {})
    facades.cacheSettings.create(IGNORED_APP_ID, { name: 'cache-a' })
    expect(spy).toHaveBeenCalledWith(RESOURCE_ID, VERSION_ID, { name: 'cache-a' })
  })

  it('edit(edgeApplicationId, payload) drops the leading id and delegates as (resourceId, versionId, payload)', () => {
    const spy = vi.spyOn(versionedCacheSettingsService, 'edit').mockImplementation(() => {})
    facades.cacheSettings.edit(IGNORED_APP_ID, { id: 7 })
    expect(spy).toHaveBeenCalledWith(RESOURCE_ID, VERSION_ID, { id: 7 })
  })

  it('remove(id) delegates as (resourceId, versionId, id)', () => {
    const spy = vi.spyOn(versionedCacheSettingsService, 'remove').mockImplementation(() => {})
    facades.cacheSettings.remove(7)
    expect(spy).toHaveBeenCalledWith(RESOURCE_ID, VERSION_ID, 7)
  })
})

describe('useVersionedFacades — deviceGroups (appId-leading + own create)', () => {
  it('list(query) delegates as (resourceId, versionId, query)', () => {
    const spy = vi.spyOn(versionedDeviceGroupService, 'list').mockImplementation(() => {})
    facades.deviceGroups.list({ page: 3 })
    expect(spy).toHaveBeenCalledWith(RESOURCE_ID, VERSION_ID, { page: 3 })
  })

  it('load(edgeApplicationId, id) drops the leading id and delegates as (resourceId, versionId, id)', () => {
    const spy = vi.spyOn(versionedDeviceGroupService, 'load').mockImplementation(() => {})
    facades.deviceGroups.load(IGNORED_APP_ID, 42)
    expect(spy).toHaveBeenCalledWith(RESOURCE_ID, VERSION_ID, 42)
  })

  it('edit(edgeApplicationId, payload) drops the leading id and delegates as (resourceId, versionId, payload)', () => {
    const spy = vi.spyOn(versionedDeviceGroupService, 'edit').mockImplementation(() => {})
    facades.deviceGroups.edit(IGNORED_APP_ID, { id: 5 })
    expect(spy).toHaveBeenCalledWith(RESOURCE_ID, VERSION_ID, { id: 5 })
  })

  it('remove(id) delegates as (resourceId, versionId, id)', () => {
    const spy = vi.spyOn(versionedDeviceGroupService, 'remove').mockImplementation(() => {})
    facades.deviceGroups.remove(5)
    expect(spy).toHaveBeenCalledWith(RESOURCE_ID, VERSION_ID, 5)
  })

  it('create(payload) uses its own single-arg signature: (resourceId, versionId, payload)', () => {
    const spy = vi.spyOn(versionedDeviceGroupService, 'create').mockImplementation(() => {})
    facades.deviceGroups.create({ name: 'dg-a' })
    expect(spy).toHaveBeenCalledWith(RESOURCE_ID, VERSION_ID, { name: 'dg-a' })
  })
})

describe('useVersionedFacades — functions', () => {
  it('list(query) delegates as (resourceId, versionId, query)', () => {
    const spy = vi.spyOn(versionedFunctionService, 'list').mockImplementation(() => {})
    facades.functions.list({ page: 2 })
    expect(spy).toHaveBeenCalledWith(RESOURCE_ID, VERSION_ID, { page: 2 })
  })

  it('load({ functionID }) unwraps functionID and delegates as (resourceId, versionId, functionID)', () => {
    const spy = vi.spyOn(versionedFunctionService, 'load').mockImplementation(() => {})
    facades.functions.load({ functionID: 7 })
    expect(spy).toHaveBeenCalledWith(RESOURCE_ID, VERSION_ID, 7)
  })

  it('create(payload) delegates as (resourceId, versionId, payload)', () => {
    const spy = vi.spyOn(versionedFunctionService, 'create').mockImplementation(() => {})
    facades.functions.create({ name: 'fn-a' })
    expect(spy).toHaveBeenCalledWith(RESOURCE_ID, VERSION_ID, { name: 'fn-a' })
  })

  it('edit(payload) delegates as (resourceId, versionId, payload)', () => {
    const spy = vi.spyOn(versionedFunctionService, 'edit').mockImplementation(() => {})
    facades.functions.edit({ id: 3 })
    expect(spy).toHaveBeenCalledWith(RESOURCE_ID, VERSION_ID, { id: 3 })
  })

  it('remove(functionId) delegates as (resourceId, versionId, functionId)', () => {
    const spy = vi.spyOn(versionedFunctionService, 'remove').mockImplementation(() => {})
    facades.functions.remove(3)
    expect(spy).toHaveBeenCalledWith(RESOURCE_ID, VERSION_ID, 3)
  })
})

describe('useVersionedFacades — rulesEngine (object-arg, versionId injected)', () => {
  it('listRulesEngineRequestAndResponsePhase injects the bound versionId, keeps the consumer edgeApplicationId', () => {
    const spy = vi
      .spyOn(versionedRulesEngineService, 'listRulesEngineRequestAndResponsePhase')
      .mockImplementation(() => {})
    facades.rulesEngine.listRulesEngineRequestAndResponsePhase({
      edgeApplicationId: IGNORED_APP_ID,
      params: { page: 1 }
    })
    expect(spy).toHaveBeenCalledWith({
      edgeApplicationId: IGNORED_APP_ID,
      versionId: VERSION_ID,
      params: { page: 1 }
    })
  })

  it('createRulesEngine spreads the payload and injects the bound versionId', () => {
    const spy = vi
      .spyOn(versionedRulesEngineService, 'createRulesEngine')
      .mockImplementation(() => {})
    facades.rulesEngine.createRulesEngine({
      edgeApplicationId: IGNORED_APP_ID,
      phase: 'request',
      name: 'rule-a'
    })
    expect(spy).toHaveBeenCalledWith({
      edgeApplicationId: IGNORED_APP_ID,
      phase: 'request',
      name: 'rule-a',
      versionId: VERSION_ID
    })
  })

  it('editRulesEngine forwards edgeApplicationId/payload/reorder and injects the bound versionId', () => {
    const spy = vi
      .spyOn(versionedRulesEngineService, 'editRulesEngine')
      .mockImplementation(() => {})
    facades.rulesEngine.editRulesEngine({
      edgeApplicationId: IGNORED_APP_ID,
      payload: { id: 1, phase: 'request' },
      reorder: true
    })
    expect(spy).toHaveBeenCalledWith({
      edgeApplicationId: IGNORED_APP_ID,
      versionId: VERSION_ID,
      payload: { id: 1, phase: 'request' },
      reorder: true
    })
  })

  it('deleteRulesEngine forwards edgeApplicationId/ruleId/phase and injects the bound versionId', () => {
    const spy = vi
      .spyOn(versionedRulesEngineService, 'deleteRulesEngine')
      .mockImplementation(() => {})
    facades.rulesEngine.deleteRulesEngine({
      edgeApplicationId: IGNORED_APP_ID,
      ruleId: 9,
      phase: 'response'
    })
    expect(spy).toHaveBeenCalledWith({
      edgeApplicationId: IGNORED_APP_ID,
      versionId: VERSION_ID,
      ruleId: 9,
      phase: 'response'
    })
  })

  it('reorderRulesEngine delegates POSITIONALLY as (newOrderData, edgeApplicationId, versionId)', () => {
    const spy = vi
      .spyOn(versionedRulesEngineService, 'reorderRulesEngine')
      .mockImplementation(() => {})
    const newOrderData = [{ id: 1 }, { id: 2 }]
    facades.rulesEngine.reorderRulesEngine(newOrderData, IGNORED_APP_ID)
    expect(spy).toHaveBeenCalledWith(newOrderData, IGNORED_APP_ID, VERSION_ID)
  })

  it('loadRulesEngine preserves extra keys, forwards id/phase, and injects the bound versionId', () => {
    const spy = vi
      .spyOn(versionedRulesEngineService, 'loadRulesEngine')
      .mockImplementation(() => {})
    facades.rulesEngine.loadRulesEngine({
      edgeApplicationId: IGNORED_APP_ID,
      id: 2,
      phase: 'request',
      extra: 'keep-me'
    })
    expect(spy).toHaveBeenCalledWith({
      extra: 'keep-me',
      edgeApplicationId: IGNORED_APP_ID,
      versionId: VERSION_ID,
      id: 2,
      phase: 'request'
    })
  })
})
