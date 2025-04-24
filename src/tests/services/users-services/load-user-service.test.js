import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { loadUserService } from '@/services/users-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  userMock: {
    id: 4462,
    last_login: '2023-12-08T11:35:55.072822Z',
    first_name: 'test name',
    last_name: 'test last name',
    email: 'test@azion.com',
    is_staff: false,
    is_active: false,
    phone: null,
    country_call_code: 'AL - 355',
    mobile: '16993388829',
    date_joined: '2023-12-08T11:35:55.072822Z',
    timezone: 'GMT',
    language: 'en',
    is_trial: false,
    two_factor_enabled: false,
    is_account_owner: false,
    teams: [{ id: 1580, name: 'Default Team', is_active: true }]
  }
}

const makeSut = () => {
  const sut = loadUserService

  return {
    sut
  }
}

describe('UsersServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: fixtures.userMock }
    })

    const { sut } = makeSut()

    await sut()

    const version = 'v4'
    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/iam/user`,
      method: 'GET'
    })
  })

  it('should parse correctly each returned item', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: fixtures.userMock }
    })
    const { sut } = makeSut()

    const result = await sut({ id: fixtures.userMock.id })

    expect(result).toEqual({
      id: fixtures.userMock.id,
      firstName: fixtures.userMock.first_name,
      lastName: fixtures.userMock.last_name,
      email: fixtures.userMock.email,
      countryCallCode: fixtures.userMock.country_call_code,
      mobile: fixtures.userMock.mobile,
      timezone: fixtures.userMock.timezone,
      language: fixtures.userMock.language,
      twoFactorEnabled: fixtures.userMock.two_factor_enabled,
      isAccountOwner: fixtures.userMock.is_account_owner,
      teamsIds: [fixtures.userMock.teams[0].id],
      dateJoined: fixtures.userMock.date_joined,
      isActive: fixtures.userMock.is_active,
      isStaff: fixtures.userMock.is_staff,
      isTrial: fixtures.userMock.is_trial,
      lastLogin: fixtures.userMock.last_login,
      phone: fixtures.userMock.phone,
      teams: fixtures.userMock.teams
    })
  })

  it('should return an error when the request fails with status 400', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: { detail: 'Bad Request' }
    })

    const { sut } = makeSut()

    await expect(sut({ id: fixtures.userMock.id })).rejects.toThrow('Bad Request')
  })
})
