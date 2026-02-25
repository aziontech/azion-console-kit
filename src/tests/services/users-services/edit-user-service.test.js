import { UsersService } from '@/services/v2/users/users-service'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/stores/account', () => ({
  useAccountStore: () => ({
    accountData: { user_id: 999 }
  })
}))

const fixtures = {
  userMock: {
    id: 4462,
    firstName: 'test name',
    lastName: 'test last name',
    timezone: 'GMT',
    language: 'en',
    email: 'test.test@azion.com',
    countryCallCode: '355',
    mobile: 12312312,
    isAccountOwner: false,
    teamsIds: [1580],
    twoFactorEnabled: false,
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
  describe('editAnotherUser', () => {
    it('should call API with correct params', async () => {
      const { sut } = makeSut()
      sut.http.request.mockResolvedValueOnce({ status: 200 })

      await sut.editAnotherUser(fixtures.userMock)

      expect(sut.http.request).toHaveBeenCalledWith({
        url: `v4/iam/users/${fixtures.userMock.id}`,
        method: 'PATCH',
        body: {
          first_name: fixtures.userMock.firstName,
          last_name: fixtures.userMock.lastName,
          timezone: fixtures.userMock.timezone,
          language: fixtures.userMock.language,
          email: fixtures.userMock.email,
          country_call_code: fixtures.userMock.countryCallCode,
          mobile: fixtures.userMock.mobile.toString(),
          is_account_owner: fixtures.userMock.isAccountOwner,
          teams_ids: fixtures.userMock.teamsIds,
          two_factor_enabled: fixtures.userMock.twoFactorEnabled,
          is_active: fixtures.userMock.isActive
        }
      })
    })

    it('should return a feedback message on successfully updated', async () => {
      const { sut } = makeSut()
      sut.http.request.mockResolvedValueOnce({ status: 200 })

      const feedbackMessage = await sut.editAnotherUser(fixtures.userMock)

      expect(feedbackMessage).toBe('Your user has been updated')
    })

    it('should remove all users queries from cache after edit', async () => {
      const { sut } = makeSut()
      sut.http.request.mockResolvedValueOnce({ status: 200 })

      await sut.editAnotherUser(fixtures.userMock)

      expect(sut.queryClient.removeQueries).toHaveBeenCalledWith({
        queryKey: ['users']
      })
    })
  })
})
