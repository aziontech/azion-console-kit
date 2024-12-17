import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listUsersService } from '@/services/users-services'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { createPinia } from 'pinia'
import { useAccountStore } from '@/stores/account'

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
  },
  loggedUserMock: {
    id: 10,
    first_name: 'Logged',
    last_name: 'User',
    email: 'logged@example.com',
    two_factor_enabled: true,
    is_active: true,
    teams: [],
    is_account_owner: true
  }
}

const makeSut = () => {
  const sut = listUsersService

  return {
    sut
  }
}

vi.mock('@/stores/account')
describe('UsersServices', () => {
  beforeEach(() => {
    createPinia()
    useAccountStore.mockReturnValue({
      accountData: { user_id: 10 }
    })
  })

  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        results: null
      }
    })

    const { sut } = makeSut()
    const version = 'v4'
    await sut({})

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/iam/users?ordering=&page=1&page_size=10&fields=&search=`,
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

    const result = await sut({})

    expect(result).toEqual([
      {
        id: fixtures.userMock.id,
        firstName: fixtures.userMock.first_name,
        lastName: fixtures.userMock.last_name,
        email: fixtures.userMock.email,
        teams: fixtures.userMock.teams,
        mfa: {
          content: 'Active',
          severity: 'success'
        },
        status: {
          content: 'Active',
          severity: 'success'
        },
        owner: {
          content: 'Yes',
          severity: 'success'
        }
      },
      {
        id: fixtures.disabledUserMock.id,
        firstName: fixtures.disabledUserMock.first_name,
        lastName: fixtures.disabledUserMock.last_name,
        email: fixtures.disabledUserMock.email,
        teams: 'Default Team, Azion Team',
        mfa: {
          content: 'Inactive',
          severity: 'danger'
        },
        status: {
          content: 'Inactive',
          severity: 'danger'
        },
        owner: {
          content: 'No',
          severity: 'info'
        }
      }
    ])
  })

  it('should return empty array if no users found', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        results: []
      }
    })
    const { sut } = makeSut()

    const result = await sut({})

    expect(result).toEqual([])
  })

  it('should return empty array if api response is not a array', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {}
    })
    const { sut } = makeSut()

    const result = await sut({})

    expect(result).toEqual([])
  })

  it('should not return logged user in list', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        results: [fixtures.userMock, fixtures.disabledUserMock, fixtures.loggedUserMock]
      }
    })
    const { sut } = makeSut()

    const result = await sut({})

    const expectedLoggedUser = {
      id: 11,
      firstName: 'Logged',
      lastName: 'User',
      email: 'logged@example.com',
      teams: [],
      mfa: { content: 'Active', severity: 'success' },
      status: { content: 'Active', severity: 'success' },
      owner: { content: 'Yes', severity: 'success' }
    }

    expect(result).not.toContainEqual(expectedLoggedUser)
  })
})
