import { UsersService } from '@/services/v2/users/users-service'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/stores/account', () => ({
  useAccountStore: () => ({
    accountData: { user_id: 999 }
  })
}))

const fixtures = {
  userMock: {
    firstName: 'John',
    lastName: 'Doe',
    timezone: 'America/New_York',
    language: 'en_US',
    email: 'johndoe@example.com',
    countryCallCode: 'AF +93',
    mobile: '+1-123-456-7890',
    isAccountOwner: true,
    teamsIds: 1,
    twoFactorEnabled: true,
    isActive: true
  }
}

const makeSut = () => {
  const sut = new UsersService()
  sut.http = {
    request: vi.fn()
  }
  sut.queryClient = {
    removeQueries: vi.fn(),
    getQueryCache: vi.fn(() => ({ findAll: vi.fn(() => []) })),
    ensureQueryData: vi.fn()
  }

  return { sut }
}

describe('UsersService', () => {
  describe('createUser', () => {
    it('should call API with correct params', async () => {
      const { sut } = makeSut()
      sut.http.request.mockResolvedValueOnce({ status: 201 })

      await sut.createUser(fixtures.userMock)

      expect(sut.http.request).toHaveBeenCalledWith({
        url: 'v4/iam/users',
        method: 'POST',
        body: {
          first_name: fixtures.userMock.firstName,
          last_name: fixtures.userMock.lastName,
          timezone: fixtures.userMock.timezone,
          language: fixtures.userMock.language,
          country_call_code: fixtures.userMock.countryCallCode,
          email: fixtures.userMock.email,
          mobile: fixtures.userMock.mobile,
          is_account_owner: fixtures.userMock.isAccountOwner,
          teams_ids: fixtures.userMock.teamsIds,
          two_factor_enabled: fixtures.userMock.twoFactorEnabled,
          is_active: fixtures.userMock.isActive
        }
      })
    })

    it('should return a feedback message on successfully created', async () => {
      const { sut } = makeSut()
      sut.http.request.mockResolvedValueOnce({ status: 201 })

      const data = await sut.createUser(fixtures.userMock)

      expect(data.feedback).toBe('Your user has been created')
      expect(data.urlToEditView).toBe('/users')
    })

    it('should remove all users queries from cache after create', async () => {
      const { sut } = makeSut()
      sut.http.request.mockResolvedValueOnce({ status: 201 })

      await sut.createUser(fixtures.userMock)

      expect(sut.queryClient.removeQueries).toHaveBeenCalledWith({
        queryKey: ['users']
      })
    })
  })
})
