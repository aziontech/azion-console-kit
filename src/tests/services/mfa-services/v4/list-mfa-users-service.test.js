import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listMfaUsersService } from '@/services/mfa-services/v4'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  confirmedMfaUserMock: {
    id: 1001,
    name: 'user1@example.com',
    confirmed: true
  },
  notConfirmedMfaUserMock: {
    id: 1002,
    name: 'user2@example.com',
    confirmed: false
  }
}

const makeSut = () => {
  const sut = listMfaUsersService

  return {
    sut
  }
}

describe('MfaManagementServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [], count: 0 }
    })
    const { sut } = makeSut()
    await sut({})

    expect(requestSpy).toHaveBeenCalledWith({
      url: 'v4/auth/mfa/totp?ordering=name&page=1&page_size=10&fields=&search=',
      method: 'GET'
    })
  })

  it('should call api with custom params when provided', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [], count: 0 }
    })
    const { sut } = makeSut()
    await sut({
      search: 'test',
      fields: 'id,name',
      ordering: 'id',
      page: 2,
      pageSize: 20
    })

    expect(requestSpy).toHaveBeenCalledWith({
      url: 'v4/auth/mfa/totp?ordering=id&page=2&page_size=20&fields=id%2Cname&search=test',
      method: 'GET'
    })
  })

  it('should parse correctly all returned mfa users', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        results: [fixtures.confirmedMfaUserMock, fixtures.notConfirmedMfaUserMock],
        count: 2
      }
    })
    const { sut } = makeSut()

    const result = await sut({})

    expect(result).toEqual({
      body: [
        {
          id: fixtures.confirmedMfaUserMock.id,
          email: fixtures.confirmedMfaUserMock.name,
          confirmed: {
            content: 'Confirmed',
            severity: 'success'
          }
        },
        {
          id: fixtures.notConfirmedMfaUserMock.id,
          email: fixtures.notConfirmedMfaUserMock.name,
          confirmed: {
            content: 'Not Confirmed',
            severity: 'danger'
          }
        }
      ],
      count: 2
    })
  })

  it('should throw an error when api returns non-200 status code', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: { error: 'Bad Request' }
    })
    const { sut } = makeSut()

    await expect(sut({})).rejects.toThrow()
  })
})
