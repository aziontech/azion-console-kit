import { UsersService } from '@/services/v2/users/users-service'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/stores/account', () => ({
  useAccountStore: () => ({
    accountData: { user_id: 999 }
  })
}))

const fixtures = {
  userMock: {
    firstName: 'test',
    lastName: 'test',
    timezone: 'GTM',
    language: 'en',
    countryCallCode: '',
    email: 'testt@azion.com',
    mobile: '',
    twoFactorEnabled: false
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
  describe('editUser (self-edit)', () => {
    it('should call API with correct params', async () => {
      const { sut } = makeSut()
      sut.http.request.mockResolvedValueOnce({ status: 200 })

      await sut.editUser(fixtures.userMock)

      expect(sut.http.request).toHaveBeenCalledWith({
        url: 'v4/iam/user',
        method: 'PATCH',
        body: {
          first_name: fixtures.userMock.firstName,
          last_name: fixtures.userMock.lastName,
          email: fixtures.userMock.email,
          language: fixtures.userMock.language,
          timezone: fixtures.userMock.timezone,
          country_call_code: fixtures.userMock.countryCallCode,
          mobile: fixtures.userMock.mobile?.toString(),
          two_factor_enabled: fixtures.userMock.twoFactorEnabled
        }
      })
    })

    it('should include password fields when password is provided', async () => {
      const { sut } = makeSut()
      sut.http.request.mockResolvedValueOnce({ status: 200 })

      const payloadWithPassword = {
        ...fixtures.userMock,
        password: 'newpass123',
        oldPassword: 'oldpass123'
      }

      await sut.editUser(payloadWithPassword)

      expect(sut.http.request).toHaveBeenCalledWith({
        url: 'v4/iam/user',
        method: 'PATCH',
        body: expect.objectContaining({
          password: 'newpass123',
          old_password: 'oldpass123'
        })
      })
    })

    it('should return a feedback message on successfully updated', async () => {
      const { sut } = makeSut()
      sut.http.request.mockResolvedValueOnce({ status: 200 })

      const data = await sut.editUser(fixtures.userMock)

      expect(data).toBe('Your user has been updated')
    })

    it('should remove all users queries from cache after self-edit', async () => {
      const { sut } = makeSut()
      sut.http.request.mockResolvedValueOnce({ status: 200 })

      await sut.editUser(fixtures.userMock)

      expect(sut.queryClient.removeQueries).toHaveBeenCalledWith({
        queryKey: ['users']
      })
    })
  })
})
