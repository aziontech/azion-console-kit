import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listEdgeFirewallService } from '@/services/edge-firewall-services'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const fixtures = {
  edgeFirewallMock: {
    id: 1239875,
    name: 'AZ firewall',
    last_editor: 'az editor',
    last_modified: new Date(2023, 10, 10),
    is_active: true,
    domains: []
  },
  edgeFirewallWithDomainsMock: {
    id: 1239875,
    name: 'AZ firewall 2',
    last_editor: 'az editor 2',
    last_modified: new Date(2023, 10, 10),
    is_active: false,
    domains: [
      { id: 1, name: 'Domain 1' },
      { id: 2, name: 'Domain 2' }
    ]
  },
  domainFactory: (id) => ({ id, name: `Domain ${id}` }),
  lastModifyDate: new Intl.DateTimeFormat('us', { dateStyle: 'full' }).format(
    new Date(2023, 10, 10)
  )
}

const makeSut = () => {
  const sut = listEdgeFirewallService

  return {
    sut
  }
}

describe('EdgeFirewallServices', () => {
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

    await sut({})

    expect(requestSpy).toHaveBeenCalledWith({
      url: `edge_firewall?order_by=name&sort=asc&page=1&page_size=200`,
      method: 'GET'
    })
  })

  it('should parsed correctly all returned firewalls', async () => {
    vi.setSystemTime(new Date(2023, 10, 10, 10))
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [fixtures.edgeFirewallMock] }
    })
    const { sut } = makeSut()

    const result = await sut({})

    expect(result).toEqual([
      {
        id: fixtures.edgeFirewallMock.id,
        name: fixtures.edgeFirewallMock.name,
        lastEditor: fixtures.edgeFirewallMock.last_editor,
        lastModify: fixtures.lastModifyDate,
        domainsList: '',
        active: 'Yes'
      }
    ])
  })

  it('should parsed correctly all returned domains of an firewall', async () => {
    vi.setSystemTime(new Date(2023, 10, 10, 10))
    vi.spyOn(AxiosHttpClientAdapter, 'request')
      .mockResolvedValueOnce({
        statusCode: 200,
        body: { results: [fixtures.edgeFirewallWithDomainsMock] }
      })
      .mockResolvedValueOnce({
        statusCode: 200,
        body: { results: fixtures.domainFactory(1) }
      })
      .mockResolvedValueOnce({
        statusCode: 200,
        body: { results: fixtures.domainFactory(2) }
      })
    const { sut } = makeSut()

    const result = await sut({})

    expect(result).toEqual([
      {
        id: fixtures.edgeFirewallWithDomainsMock.id,
        name: fixtures.edgeFirewallWithDomainsMock.name,
        lastEditor: fixtures.edgeFirewallWithDomainsMock.last_editor,
        lastModify: fixtures.lastModifyDate,
        domainsList: `Domain 1<br>Domain 2`,
        active: 'No'
      }
    ])
  })
})
