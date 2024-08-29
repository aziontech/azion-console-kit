import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listEdgeFirewallService } from '@/services/edge-firewall-services'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { localeMock } from '@/tests/utils/localeMock'

const fixtures = {
  edgeFirewallMock: {
    id: 1239875,
    name: 'AZ firewall',
    last_editor: 'az editor',
    last_modified: new Date(2023, 10, 10),
    is_active: true
  },
  edgeFirewallWithDomainsMock: {
    id: 1239875,
    name: 'AZ firewall 2',
    last_editor: 'az editor 2',
    last_modified: new Date(2023, 10, 10),
    is_active: false
  },
  domainFactory: (id) => ({ id, name: `Domain ${id}` })
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
      url: 'v3/edge_firewall?order_by=name&sort=asc&page=1&page_size=200',
      method: 'GET'
    })
  })

  it('should parsed correctly all returned firewalls', async () => {
    localeMock()
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
        lastModify: 'Friday, November 10, 2023',
        lastModifyDate: new Date('2023-11-10T00:00:00.000Z'),
        status: {
          content: 'Active',
          severity: 'success'
        }
      }
    ])
  })

  it('should parsed correctly all returned domains of an firewall', async () => {
    localeMock()
    vi.setSystemTime(new Date(2023, 10, 10, 10))
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [fixtures.edgeFirewallWithDomainsMock] }
    })

    const { sut } = makeSut()

    const result = await sut({})

    expect(result).toEqual([
      {
        id: fixtures.edgeFirewallWithDomainsMock.id,
        name: fixtures.edgeFirewallWithDomainsMock.name,
        lastEditor: fixtures.edgeFirewallWithDomainsMock.last_editor,
        lastModify: 'Friday, November 10, 2023',
        lastModifyDate: new Date('2023-11-10T00:00:00.000Z'),
        status: {
          content: 'Inactive',
          severity: 'danger'
        }
      }
    ])
  })
})
