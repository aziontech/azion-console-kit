import { afterEach, describe, expect, it, vi } from 'vitest'
import { httpService } from '@/services/v2/base/http/httpService'
import { queryClient } from '@/services/v2/base/query/queryClient'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { versionedWafExceptionsService } from '@/services/v2/waf/versioned/versioned-waf-exceptions-service'

const WAF_ID = 'waf-1'
const VID = 'AVWAF0001'
const URL = `v4/workspace/wafs/${WAF_ID}/versions/${VID}/exceptions`

const stubEnsure = () =>
  vi
    .spyOn(versionedWafExceptionsService, 'useEnsureQueryData')
    .mockImplementation((_key, queryFn) => queryFn())

afterEach(() => {
  vi.restoreAllMocks()
})

describe('versionedWafExceptionsService', () => {
  it('list GETs the versioned exceptions URL scoped to (wafId, versionId)', async () => {
    stubEnsure()
    const requestSpy = vi.spyOn(httpService, 'request').mockResolvedValueOnce({
      data: {
        count: 1,
        results: [{ id: 5, name: 'allow', conditions: [], rule_id: 9, active: true }]
      }
    })

    const result = await versionedWafExceptionsService.list(WAF_ID, VID, { page: 1 })

    expect(requestSpy).toHaveBeenCalledWith({ method: 'GET', url: URL, params: { page: 1 } })
    expect(result.count).toBe(1)
    expect(result.body[0].name).toBe('allow')
  })

  it('load GETs a single exception by id', async () => {
    stubEnsure()
    const requestSpy = vi.spyOn(httpService, 'request').mockResolvedValueOnce({
      data: { data: { id: 5, name: 'allow', conditions: [], rule_id: 9, active: true } }
    })

    const result = await versionedWafExceptionsService.load(WAF_ID, VID, 5)

    expect(requestSpy).toHaveBeenCalledWith({ method: 'GET', url: `${URL}/5` })
    expect(result.id).toBe(5)
  })

  it('create POSTs the mapped payload and invalidates the version cache', async () => {
    const removeSpy = vi.spyOn(queryClient, 'removeQueries').mockImplementation(() => {})
    const requestSpy = vi
      .spyOn(httpService, 'request')
      .mockResolvedValueOnce({ data: { data: { id: 7 } } })

    const result = await versionedWafExceptionsService.create(WAF_ID, VID, {
      name: 'allow',
      path: '/x',
      ruleId: 9,
      status: true,
      conditions: []
    })

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      url: URL,
      body: expect.objectContaining({ name: 'allow', path: '/x', rule_id: 9 })
    })
    expect(removeSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.waf.version.exceptions.all(WAF_ID, VID)
    })
    expect(result).toEqual({ id: 7, feedback: 'Your WAF allowed rule has been created' })
  })

  it('edit PUTs by id and invalidates the version cache', async () => {
    const removeSpy = vi.spyOn(queryClient, 'removeQueries').mockImplementation(() => {})
    const requestSpy = vi.spyOn(httpService, 'request').mockResolvedValueOnce({ data: {} })

    const result = await versionedWafExceptionsService.edit(WAF_ID, VID, {
      id: 5,
      name: 'allow',
      ruleId: 9,
      status: true,
      conditions: []
    })

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'PUT',
      url: `${URL}/5`,
      body: expect.objectContaining({ name: 'allow', rule_id: 9 })
    })
    expect(removeSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.waf.version.exceptions.all(WAF_ID, VID)
    })
    expect(result).toBe('Your WAF allowed rule has been updated')
  })

  it('remove DELETEs by id and invalidates the version cache', async () => {
    const removeSpy = vi.spyOn(queryClient, 'removeQueries').mockImplementation(() => {})
    const requestSpy = vi.spyOn(httpService, 'request').mockResolvedValueOnce({ data: {} })

    await versionedWafExceptionsService.remove(WAF_ID, VID, 55)

    expect(requestSpy).toHaveBeenCalledWith({ method: 'DELETE', url: `${URL}/55` })
    expect(removeSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.waf.version.exceptions.all(WAF_ID, VID)
    })
  })
})
