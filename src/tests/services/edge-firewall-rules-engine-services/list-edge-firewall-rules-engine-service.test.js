import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listEdgeFirewallRulesEngineService } from '@/services/edge-firewall-rules-engine-services'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { localeMock } from '@/tests/utils/localeMock'

const fixtures = {
  edgeFirewallRulesEngineMock: {
    id: 1239875,
    name: 'AZ firewall rules engine',
    description: 'My description',
    last_modified: new Date(2023, 10, 10),
    last_editor: 'az editor',
    is_active: true
  },
  edgeFirewallRulesEngineInactiveMock: {
    id: 1239876,
    name: 'AZ firewall rules engine 2',
    description: 'My description 2',
    last_modified: new Date(2023, 10, 11),
    last_editor: 'az editor 2',
    is_active: false
  }
}

const makeSut = () => {
  const sut = listEdgeFirewallRulesEngineService

  return {
    sut
  }
}

describe('EdgeFirewallRulesEngineServices', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [] }
    })
    const { sut } = makeSut()
    await sut({ edgeFirewallId: 123 })

    expect(requestSpy).toHaveBeenCalledWith({
      url: 'v3/edge_firewall/123/rules_engine?order_by=id&sort=asc&page=1&page_size=200',
      method: 'GET'
    })
  })

  it('should parse correctly all returned rules engines', async () => {
    localeMock()
    vi.setSystemTime(new Date(2023, 10, 10, 10))
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [fixtures.edgeFirewallRulesEngineMock] }
    })
    const { sut } = makeSut()

    const result = await sut({ edgeFirewallId: 123 })

    expect(result).toEqual([
      {
        id: fixtures.edgeFirewallRulesEngineMock.id,
        name: fixtures.edgeFirewallRulesEngineMock.name,
        description: fixtures.edgeFirewallRulesEngineMock.description,
        lastModified: 'November 10, 2023 at 12:00 AM',
        lastEditor: fixtures.edgeFirewallRulesEngineMock.last_editor,
        status: {
          content: 'Active',
          severity: 'success'
        }
      }
    ])
  })

  it('should parse correctly inactive rules engines', async () => {
    localeMock()
    vi.setSystemTime(new Date(2023, 10, 11, 10))
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [fixtures.edgeFirewallRulesEngineInactiveMock] }
    })
    const { sut } = makeSut()

    const result = await sut({ edgeFirewallId: 123 })

    expect(result).toEqual([
      {
        id: fixtures.edgeFirewallRulesEngineInactiveMock.id,
        name: fixtures.edgeFirewallRulesEngineInactiveMock.name,
        description: fixtures.edgeFirewallRulesEngineInactiveMock.description,
        lastModified: 'November 11, 2023 at 12:00 AM',
        lastEditor: fixtures.edgeFirewallRulesEngineInactiveMock.last_editor,
        status: {
          content: 'Inactive',
          severity: 'danger'
        }
      }
    ])
  })
})
