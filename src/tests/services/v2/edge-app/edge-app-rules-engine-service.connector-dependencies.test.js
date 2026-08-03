import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RulesEngineService } from '@/services/v2/edge-app/edge-app-rules-engine-service'
import { versionedRulesEngineService } from '@/services/v2/edge-app/versioned/versioned-rules-engine-service'

const APP_ID = 'app-123'
const VERSION_ID = 'version-456'

let service

beforeEach(() => {
  service = new RulesEngineService()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('RulesEngineService - listConnectorDependencies', () => {
  it('should request the request and response phases with the connector discovery fields', async () => {
    const listSpy = vi
      .spyOn(service, 'listRulesEngineRequestAndResponsePhase')
      .mockResolvedValueOnce({ body: [] })

    await service.listConnectorDependencies(APP_ID)

    expect(listSpy).toHaveBeenCalledWith({
      edgeApplicationId: APP_ID,
      params: { fields: ['id', 'name', 'behaviors', 'phase'], ordering: 'id' }
    })
  })

  it('should extract the connectorId from a raw set_connector behavior using attributes.value', async () => {
    vi.spyOn(service, 'listRulesEngineRequestAndResponsePhase').mockResolvedValueOnce({
      body: [
        {
          id: 1,
          phase: 'request',
          behaviors: [{ type: 'set_connector', attributes: { value: 10 } }]
        }
      ]
    })

    const result = await service.listConnectorDependencies(APP_ID)

    expect(result).toEqual([{ connectorId: 10, ruleCount: 1 }])
  })

  it('should dedupe the same connector referenced by multiple rules into one entry with the rule count', async () => {
    vi.spyOn(service, 'listRulesEngineRequestAndResponsePhase').mockResolvedValueOnce({
      body: [
        {
          id: 1,
          phase: 'request',
          behaviors: [{ type: 'set_connector', attributes: { value: 10 } }]
        },
        {
          id: 2,
          phase: 'request',
          behaviors: [{ type: 'set_connector', attributes: { value: 10 } }]
        },
        {
          id: 3,
          phase: 'response',
          behaviors: [{ type: 'set_connector', attributes: { value: 10 } }]
        }
      ]
    })

    const result = await service.listConnectorDependencies(APP_ID)

    expect(result).toEqual([{ connectorId: 10, ruleCount: 3 }])
  })

  it('should return one entry per distinct connector across request and response rules', async () => {
    vi.spyOn(service, 'listRulesEngineRequestAndResponsePhase').mockResolvedValueOnce({
      body: [
        {
          id: 1,
          phase: 'request',
          behaviors: [{ type: 'set_connector', attributes: { value: 10 } }]
        },
        {
          id: 2,
          phase: 'request',
          behaviors: [{ type: 'set_connector', attributes: { value: 20 } }]
        },
        {
          id: 3,
          phase: 'response',
          behaviors: [{ type: 'set_connector', attributes: { value: 30 } }]
        }
      ]
    })

    const result = await service.listConnectorDependencies(APP_ID)

    expect(result).toEqual([
      { connectorId: 10, ruleCount: 1 },
      { connectorId: 20, ruleCount: 1 },
      { connectorId: 30, ruleCount: 1 }
    ])
  })

  it('should ignore rules without a set_connector behavior and other behavior types', async () => {
    vi.spyOn(service, 'listRulesEngineRequestAndResponsePhase').mockResolvedValueOnce({
      body: [
        { id: 1, phase: 'request', behaviors: [{ type: 'deliver' }] },
        {
          id: 2,
          phase: 'request',
          behaviors: [
            { type: 'set_cache_policy', attributes: { value: 99 } },
            { type: 'set_connector', attributes: { value: 10 } }
          ]
        },
        { id: 3, phase: 'response', behaviors: [] },
        { id: 4, phase: 'response' }
      ]
    })

    const result = await service.listConnectorDependencies(APP_ID)

    expect(result).toEqual([{ connectorId: 10, ruleCount: 1 }])
  })

  it('should skip set_connector behaviors whose connector id is null or undefined', async () => {
    vi.spyOn(service, 'listRulesEngineRequestAndResponsePhase').mockResolvedValueOnce({
      body: [
        {
          id: 1,
          phase: 'request',
          behaviors: [{ type: 'set_connector', attributes: { value: null } }]
        },
        { id: 2, phase: 'request', behaviors: [{ type: 'set_connector', attributes: {} }] },
        { id: 3, phase: 'request', behaviors: [{ type: 'set_connector' }] },
        {
          id: 4,
          phase: 'response',
          behaviors: [{ type: 'set_connector', attributes: { value: 10 } }]
        }
      ]
    })

    const result = await service.listConnectorDependencies(APP_ID)

    expect(result).toEqual([{ connectorId: 10, ruleCount: 1 }])
  })

  it('should return an empty array when the body has no rules', async () => {
    vi.spyOn(service, 'listRulesEngineRequestAndResponsePhase').mockResolvedValueOnce({ body: [] })

    const result = await service.listConnectorDependencies(APP_ID)

    expect(result).toEqual([])
  })

  it('should return an empty array when the body is not an array', async () => {
    vi.spyOn(service, 'listRulesEngineRequestAndResponsePhase').mockResolvedValueOnce({
      body: undefined
    })

    const result = await service.listConnectorDependencies(APP_ID)

    expect(result).toEqual([])
  })

  it('should handle the parsed behavior shape using name and edgeConnectorId', async () => {
    vi.spyOn(service, 'listRulesEngineRequestAndResponsePhase').mockResolvedValueOnce({
      body: [
        { id: 1, phase: 'request', behaviors: [{ name: 'set_connector', edgeConnectorId: 7 }] },
        { id: 2, phase: 'response', behaviors: [{ name: 'set_connector', edgeConnectorId: 7 }] }
      ]
    })

    const result = await service.listConnectorDependencies(APP_ID)

    expect(result).toEqual([{ connectorId: 7, ruleCount: 2 }])
  })
})

describe('RulesEngineService - listConnectorDependenciesByVersion', () => {
  it('should request the versioned service with the application id, version id and connector discovery params', async () => {
    const listSpy = vi
      .spyOn(versionedRulesEngineService, 'listRulesEngineRequestAndResponsePhase')
      .mockResolvedValueOnce({ body: [] })

    await service.listConnectorDependenciesByVersion(APP_ID, VERSION_ID)

    expect(listSpy).toHaveBeenCalledWith({
      edgeApplicationId: APP_ID,
      versionId: VERSION_ID,
      params: { fields: ['id', 'name', 'behaviors', 'phase'], ordering: 'id' }
    })
  })

  it('should extract and dedupe connector ids from raw set_connector behaviors', async () => {
    vi.spyOn(
      versionedRulesEngineService,
      'listRulesEngineRequestAndResponsePhase'
    ).mockResolvedValueOnce({
      body: [
        {
          id: 1,
          phase: 'request',
          behaviors: [{ type: 'set_connector', attributes: { value: 10 } }]
        },
        {
          id: 2,
          phase: 'request',
          behaviors: [{ type: 'set_connector', attributes: { value: 10 } }]
        },
        {
          id: 3,
          phase: 'response',
          behaviors: [{ type: 'set_connector', attributes: { value: 20 } }]
        }
      ]
    })

    const result = await service.listConnectorDependenciesByVersion(APP_ID, VERSION_ID)

    expect(result).toEqual([
      { connectorId: 10, ruleCount: 2 },
      { connectorId: 20, ruleCount: 1 }
    ])
  })

  it('should ignore behaviors that are not set_connector', async () => {
    vi.spyOn(
      versionedRulesEngineService,
      'listRulesEngineRequestAndResponsePhase'
    ).mockResolvedValueOnce({
      body: [
        { id: 1, phase: 'request', behaviors: [{ type: 'deliver' }] },
        {
          id: 2,
          phase: 'request',
          behaviors: [
            { type: 'set_cache_policy', attributes: { value: 99 } },
            { type: 'set_connector', attributes: { value: 10 } }
          ]
        }
      ]
    })

    const result = await service.listConnectorDependenciesByVersion(APP_ID, VERSION_ID)

    expect(result).toEqual([{ connectorId: 10, ruleCount: 1 }])
  })

  it('should skip set_connector behaviors whose connector id is null or undefined', async () => {
    vi.spyOn(
      versionedRulesEngineService,
      'listRulesEngineRequestAndResponsePhase'
    ).mockResolvedValueOnce({
      body: [
        {
          id: 1,
          phase: 'request',
          behaviors: [{ type: 'set_connector', attributes: { value: null } }]
        },
        { id: 2, phase: 'request', behaviors: [{ type: 'set_connector', attributes: {} }] },
        { id: 3, phase: 'request', behaviors: [{ type: 'set_connector' }] },
        {
          id: 4,
          phase: 'response',
          behaviors: [{ type: 'set_connector', attributes: { value: 10 } }]
        }
      ]
    })

    const result = await service.listConnectorDependenciesByVersion(APP_ID, VERSION_ID)

    expect(result).toEqual([{ connectorId: 10, ruleCount: 1 }])
  })

  it('should return an empty array when the versioned body has no rules', async () => {
    vi.spyOn(
      versionedRulesEngineService,
      'listRulesEngineRequestAndResponsePhase'
    ).mockResolvedValueOnce({ body: [] })

    const result = await service.listConnectorDependenciesByVersion(APP_ID, VERSION_ID)

    expect(result).toEqual([])
  })
})
