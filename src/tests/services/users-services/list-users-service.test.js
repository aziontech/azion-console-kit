import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listUsersService } from '@/services/users-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  userMock: {
    id: 12378,
    first_name: 'John',
    last_name: 'Doe',
    email: 'johndoe@example.com',
    two_factor_enabled: true,
    is_active: true,
    teams: [],
    is_account_owner: true
  },
  disabledUserMock: {
    id: 98287398,
    first_name: 'John',
    last_name: 'Doe',
    email: 'johndoe@example.com',
    two_factor_enabled: false,
    is_active: false,
    teams: [
      {
        id: 1730,
        name: 'Default Team',
        is_active: true
      },
      {
        id: 1731,
        name: 'Azion Team',
        is_active: true
      }
    ],
    is_account_owner: false
  }
}

const makeSut = () => {
  const sut = listUsersService

  return {
    sut
  }
}

describe('UsersServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        results: null
      }
    })

    const { sut } = makeSut()

    await sut()

    expect(requestSpy).toHaveBeenCalledWith({
      url: `users`,
      method: 'GET'
    })
  })

  it('should parsed correctly each user', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        results: [fixtures.userMock, fixtures.disabledUserMock]
      }
    })
    const { sut } = makeSut()

    const result = await sut()

    expect(result).toEqual([
      {
        id: fixtures.userMock.id,
        firstName: fixtures.userMock.first_name,
        lastName: fixtures.userMock.last_name,
        email: fixtures.userMock.email,
        teams: fixtures.userMock.teams,
        mfa: 'Yes',
        active: 'Yes',
        owner: 'Yes'
      },
      {
        id: fixtures.disabledUserMock.id,
        firstName: fixtures.disabledUserMock.first_name,
        lastName: fixtures.disabledUserMock.last_name,
        email: fixtures.disabledUserMock.email,
        teams: 'Default Team, Azion Team',
        mfa: 'No',
        active: 'No',
        owner: 'No'
      }
    ])
  })
})
