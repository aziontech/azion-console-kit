import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/services/v2/edge-firewall/versioned/versioned-firewall-function-service', () => ({
  versionedFirewallFunctionService: {
    list: vi.fn()
  }
}))

import { EdgeFirewallFunctionService } from '@/services/v2/edge-firewall/edge-firewall-function-service'
import { versionedFirewallFunctionService } from '@/services/v2/edge-firewall/versioned/versioned-firewall-function-service'

const FIREWALL_ID = 'fw-123'
const VERSION_ID = 'version-789'

let service

beforeEach(() => {
  service = new EdgeFirewallFunctionService()
})

afterEach(() => {
  vi.restoreAllMocks()
  versionedFirewallFunctionService.list.mockReset()
})

describe('EdgeFirewallFunctionService - listFunctionDependenciesByVersion', () => {
  it('should fetch the versioned function instances for the firewall and version with a page size of 100', async () => {
    versionedFirewallFunctionService.list.mockResolvedValueOnce({ body: [], count: 0 })

    await service.listFunctionDependenciesByVersion(FIREWALL_ID, VERSION_ID)

    expect(versionedFirewallFunctionService.list).toHaveBeenCalledWith(FIREWALL_ID, VERSION_ID, {
      pageSize: 100
    })
  })

  it('should map the adapted key "edgeFunctionId" to functionId', async () => {
    versionedFirewallFunctionService.list.mockResolvedValueOnce({
      body: [
        { id: 1, edgeFunctionId: 5001 },
        { id: 2, edgeFunctionId: 5002 }
      ],
      count: 2
    })

    const result = await service.listFunctionDependenciesByVersion(FIREWALL_ID, VERSION_ID)

    expect(result).toEqual([
      { functionId: 5001, instanceCount: 1 },
      { functionId: 5002, instanceCount: 1 }
    ])
  })

  it('should fall back to the raw "function" key when edgeFunctionId is absent', async () => {
    versionedFirewallFunctionService.list.mockResolvedValueOnce({
      body: [
        { id: 1, function: 5001 },
        { id: 2, function: 5002 }
      ],
      count: 2
    })

    const result = await service.listFunctionDependenciesByVersion(FIREWALL_ID, VERSION_ID)

    expect(result).toEqual([
      { functionId: 5001, instanceCount: 1 },
      { functionId: 5002, instanceCount: 1 }
    ])
  })

  it('should collapse multiple instances of the same function id into one entry with the instance count', async () => {
    versionedFirewallFunctionService.list.mockResolvedValueOnce({
      body: [
        { id: 1, edgeFunctionId: 5001 },
        { id: 2, edgeFunctionId: 5001 },
        { id: 3, edgeFunctionId: 5001 }
      ],
      count: 3
    })

    const result = await service.listFunctionDependenciesByVersion(FIREWALL_ID, VERSION_ID)

    expect(result).toEqual([{ functionId: 5001, instanceCount: 3 }])
  })

  it('should count distinct and repeated function ids together', async () => {
    versionedFirewallFunctionService.list.mockResolvedValueOnce({
      body: [
        { id: 1, edgeFunctionId: 5001 },
        { id: 2, edgeFunctionId: 5002 },
        { id: 3, edgeFunctionId: 5001 },
        { id: 4, edgeFunctionId: 5002 },
        { id: 5, edgeFunctionId: 5002 }
      ],
      count: 5
    })

    const result = await service.listFunctionDependenciesByVersion(FIREWALL_ID, VERSION_ID)

    expect(result).toEqual([
      { functionId: 5001, instanceCount: 2 },
      { functionId: 5002, instanceCount: 3 }
    ])
  })

  it('should skip instances whose function id is null or undefined', async () => {
    versionedFirewallFunctionService.list.mockResolvedValueOnce({
      body: [
        { id: 1, edgeFunctionId: 5001 },
        { id: 2, edgeFunctionId: null },
        { id: 3 },
        { id: 4, edgeFunctionId: 5002 }
      ],
      count: 4
    })

    const result = await service.listFunctionDependenciesByVersion(FIREWALL_ID, VERSION_ID)

    expect(result).toEqual([
      { functionId: 5001, instanceCount: 1 },
      { functionId: 5002, instanceCount: 1 }
    ])
  })

  it('should return an empty array when the body is empty', async () => {
    versionedFirewallFunctionService.list.mockResolvedValueOnce({ body: [], count: 0 })

    const result = await service.listFunctionDependenciesByVersion(FIREWALL_ID, VERSION_ID)

    expect(result).toEqual([])
  })
})
