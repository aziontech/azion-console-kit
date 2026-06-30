import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/services/v2/edge-app/versioned/versioned-function-service', () => ({
  versionedFunctionService: {
    list: vi.fn()
  }
}))

import { EdgeApplicationFunctionService } from '@/services/v2/edge-app/edge-application-functions-service'
import { versionedFunctionService } from '@/services/v2/edge-app/versioned/versioned-function-service'

const APP_ID = 'app-123'
const VERSION_ID = 'version-789'

let service

beforeEach(() => {
  service = new EdgeApplicationFunctionService()
})

afterEach(() => {
  vi.restoreAllMocks()
  versionedFunctionService.list.mockReset()
})

describe('EdgeApplicationFunctionService - listFunctionDependencies', () => {
  it('should map the adapter output key "function" (fields=[function]) to functionId', async () => {
    vi.spyOn(service, 'listFunctions').mockResolvedValueOnce({
      body: [
        { id: 1, function: 5001 },
        { id: 2, function: 5002 }
      ],
      count: 2
    })

    const result = await service.listFunctionDependencies(APP_ID)

    expect(result).toEqual([
      { functionId: 5001, instanceCount: 1 },
      { functionId: 5002, instanceCount: 1 }
    ])
  })

  it('should request the function field with a page size of 100', async () => {
    const listFunctionsSpy = vi
      .spyOn(service, 'listFunctions')
      .mockResolvedValueOnce({ body: [], count: 0 })

    await service.listFunctionDependencies(APP_ID)

    expect(listFunctionsSpy).toHaveBeenCalledWith(APP_ID, {
      fields: ['function'],
      pageSize: 100
    })
  })

  it('should collapse multiple instances of the same function id into one entry with the instance count', async () => {
    vi.spyOn(service, 'listFunctions').mockResolvedValueOnce({
      body: [
        { id: 1, edgeFunction: 5001 },
        { id: 2, edgeFunction: 5001 },
        { id: 3, edgeFunction: 5001 }
      ],
      count: 3
    })

    const result = await service.listFunctionDependencies(APP_ID)

    expect(result).toEqual([{ functionId: 5001, instanceCount: 3 }])
  })

  it('should return one entry per distinct function id', async () => {
    vi.spyOn(service, 'listFunctions').mockResolvedValueOnce({
      body: [
        { id: 1, edgeFunction: 5001 },
        { id: 2, edgeFunction: 5002 },
        { id: 3, edgeFunction: 5003 }
      ],
      count: 3
    })

    const result = await service.listFunctionDependencies(APP_ID)

    expect(result).toEqual([
      { functionId: 5001, instanceCount: 1 },
      { functionId: 5002, instanceCount: 1 },
      { functionId: 5003, instanceCount: 1 }
    ])
  })

  it('should count distinct and repeated function ids together', async () => {
    vi.spyOn(service, 'listFunctions').mockResolvedValueOnce({
      body: [
        { id: 1, edgeFunction: 5001 },
        { id: 2, edgeFunction: 5002 },
        { id: 3, edgeFunction: 5001 },
        { id: 4, edgeFunction: 5002 },
        { id: 5, edgeFunction: 5002 }
      ],
      count: 5
    })

    const result = await service.listFunctionDependencies(APP_ID)

    expect(result).toEqual([
      { functionId: 5001, instanceCount: 2 },
      { functionId: 5002, instanceCount: 3 }
    ])
  })

  it('should skip instances whose edgeFunction is null', async () => {
    vi.spyOn(service, 'listFunctions').mockResolvedValueOnce({
      body: [
        { id: 1, edgeFunction: 5001 },
        { id: 2, edgeFunction: null },
        { id: 3, edgeFunction: 5002 }
      ],
      count: 3
    })

    const result = await service.listFunctionDependencies(APP_ID)

    expect(result).toEqual([
      { functionId: 5001, instanceCount: 1 },
      { functionId: 5002, instanceCount: 1 }
    ])
  })

  it('should skip instances whose edgeFunction is undefined', async () => {
    vi.spyOn(service, 'listFunctions').mockResolvedValueOnce({
      body: [{ id: 1, edgeFunction: 5001 }, { id: 2 }, { id: 3, edgeFunction: 5002 }],
      count: 3
    })

    const result = await service.listFunctionDependencies(APP_ID)

    expect(result).toEqual([
      { functionId: 5001, instanceCount: 1 },
      { functionId: 5002, instanceCount: 1 }
    ])
  })

  it('should keep a zero function id as a valid dependency', async () => {
    vi.spyOn(service, 'listFunctions').mockResolvedValueOnce({
      body: [
        { id: 1, edgeFunction: 0 },
        { id: 2, edgeFunction: 0 }
      ],
      count: 2
    })

    const result = await service.listFunctionDependencies(APP_ID)

    expect(result).toEqual([{ functionId: 0, instanceCount: 2 }])
  })

  it('should return an empty array when there are no instances', async () => {
    vi.spyOn(service, 'listFunctions').mockResolvedValueOnce({ body: [], count: 0 })

    const result = await service.listFunctionDependencies(APP_ID)

    expect(result).toEqual([])
  })

  it('should warn and not throw when the listing count exceeds the page size', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(service, 'listFunctions').mockResolvedValueOnce({
      body: [{ id: 1, edgeFunction: 5001 }],
      count: 250
    })

    const result = await service.listFunctionDependencies(APP_ID)

    expect(result).toEqual([{ functionId: 5001, instanceCount: 1 }])
    expect(warnSpy).toHaveBeenCalledTimes(1)
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('250'))
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining(APP_ID))
  })

  it('should not warn when the listing count is within the page size', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(service, 'listFunctions').mockResolvedValueOnce({
      body: [{ id: 1, edgeFunction: 5001 }],
      count: 100
    })

    await service.listFunctionDependencies(APP_ID)

    expect(warnSpy).not.toHaveBeenCalled()
  })
})

describe('EdgeApplicationFunctionService - listFunctionDependenciesByVersion', () => {
  it('should fetch the versioned function instances for the application and version with a page size of 100', async () => {
    versionedFunctionService.list.mockResolvedValueOnce({ body: [], count: 0 })

    await service.listFunctionDependenciesByVersion(APP_ID, VERSION_ID)

    expect(versionedFunctionService.list).toHaveBeenCalledWith(APP_ID, VERSION_ID, {
      pageSize: 100
    })
  })

  it('should map the raw versioned key "function" to functionId', async () => {
    versionedFunctionService.list.mockResolvedValueOnce({
      body: [
        { id: 1, function: 5001 },
        { id: 2, function: 5002 }
      ],
      count: 2
    })

    const result = await service.listFunctionDependenciesByVersion(APP_ID, VERSION_ID)

    expect(result).toEqual([
      { functionId: 5001, instanceCount: 1 },
      { functionId: 5002, instanceCount: 1 }
    ])
  })

  it('should fall back to the edgeFunction key when function is absent', async () => {
    versionedFunctionService.list.mockResolvedValueOnce({
      body: [
        { id: 1, edgeFunction: 5001 },
        { id: 2, edgeFunction: 5002 }
      ],
      count: 2
    })

    const result = await service.listFunctionDependenciesByVersion(APP_ID, VERSION_ID)

    expect(result).toEqual([
      { functionId: 5001, instanceCount: 1 },
      { functionId: 5002, instanceCount: 1 }
    ])
  })

  it('should collapse multiple instances of the same function id into one entry with the instance count', async () => {
    versionedFunctionService.list.mockResolvedValueOnce({
      body: [
        { id: 1, function: 5001 },
        { id: 2, function: 5001 },
        { id: 3, function: 5001 }
      ],
      count: 3
    })

    const result = await service.listFunctionDependenciesByVersion(APP_ID, VERSION_ID)

    expect(result).toEqual([{ functionId: 5001, instanceCount: 3 }])
  })

  it('should count distinct and repeated function ids together', async () => {
    versionedFunctionService.list.mockResolvedValueOnce({
      body: [
        { id: 1, function: 5001 },
        { id: 2, function: 5002 },
        { id: 3, function: 5001 },
        { id: 4, function: 5002 },
        { id: 5, function: 5002 }
      ],
      count: 5
    })

    const result = await service.listFunctionDependenciesByVersion(APP_ID, VERSION_ID)

    expect(result).toEqual([
      { functionId: 5001, instanceCount: 2 },
      { functionId: 5002, instanceCount: 3 }
    ])
  })

  it('should skip instances whose function is null', async () => {
    versionedFunctionService.list.mockResolvedValueOnce({
      body: [
        { id: 1, function: 5001 },
        { id: 2, function: null },
        { id: 3, function: 5002 }
      ],
      count: 3
    })

    const result = await service.listFunctionDependenciesByVersion(APP_ID, VERSION_ID)

    expect(result).toEqual([
      { functionId: 5001, instanceCount: 1 },
      { functionId: 5002, instanceCount: 1 }
    ])
  })

  it('should skip instances whose function is undefined', async () => {
    versionedFunctionService.list.mockResolvedValueOnce({
      body: [{ id: 1, function: 5001 }, { id: 2 }, { id: 3, function: 5002 }],
      count: 3
    })

    const result = await service.listFunctionDependenciesByVersion(APP_ID, VERSION_ID)

    expect(result).toEqual([
      { functionId: 5001, instanceCount: 1 },
      { functionId: 5002, instanceCount: 1 }
    ])
  })

  it('should return an empty array when the body is empty', async () => {
    versionedFunctionService.list.mockResolvedValueOnce({ body: [], count: 0 })

    const result = await service.listFunctionDependenciesByVersion(APP_ID, VERSION_ID)

    expect(result).toEqual([])
  })
})
