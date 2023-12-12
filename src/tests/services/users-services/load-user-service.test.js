import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { loadUserService } from '@/services/users-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  userMock: {
    country_call_code: "BR - 55",
    date_joined: "2023-09-19T19:53:33Z",
    email: "paulo.ferreira+teste1@azion.com",
    first_name: "Paulo",
    id: 3652,
    is_account_owner: true,
    is_active: true,
    is_staff: true,
    is_trial: true,
    language: "en",
    last_login: "2023-12-12T17:52:07.700273Z",
    last_name: "Sobrinho Ferreira",
    mobile: "89994258779",
    phone: "",
    teams: [],
    timezone: "GMT",
    two_factor_enabled: true,
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
      body: {data: fixtures.userMock}
    })

    const { sut } = makeSut()

    await sut({id : fixtures.userMock.id })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `users/${fixtures.userMock.id}`,
      method: 'GET'
    })
  })

  it('should parse correctly each returned item', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
        statusCode: 200,
        body:  {data: fixtures.userMock}
      })
    const { sut } = makeSut()

    const result = await sut({})

    expect(result).toEqual({
      countryCallCode: fixtures.userMock.country_call_code,
      dateJoined: fixtures.userMock.date_joined,
      email: fixtures.userMock.email,
      firstName: fixtures.userMock.first_name,
      id: fixtures.userMock.id,
      isAccountOwner: fixtures.userMock.is_account_owner,
      isActive: fixtures.userMock.is_active,
      isStaff: fixtures.userMock.is_staff,
      isTrial:  fixtures.userMock.is_trial,
      language: fixtures.userMock.language,
      lastLogin: fixtures.userMock.last_login,
      lastName: fixtures.userMock.last_name,
      mobile: fixtures.userMock.mobile,
      phone: fixtures.userMock.phone,
      teams: fixtures.userMock.teams,
      timezone: fixtures.userMock.timezone,
      twoFactorEnabled: fixtures.userMock.two_factor_enabled
    })
  })
})
