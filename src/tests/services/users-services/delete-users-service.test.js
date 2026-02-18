import { UsersService } from '@/services/v2/users/users-service'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/stores/account', () => ({
  useAccountStore: () => ({
    accountData: { user_id: 999 }
  })
}))

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
  describe('deleteUser', () => {
    it('should call API with correct params', async () => {
      const { sut } = makeSut()
      sut.http.request.mockResolvedValueOnce({ status: 200 })
      const userIdMock = 765678

      await sut.deleteUser(userIdMock)

      expect(sut.http.request).toHaveBeenCalledWith({
        url: `v4/iam/users/${userIdMock}`,
        method: 'DELETE'
      })
    })

    it('should return a feedback message on successfully deleted', async () => {
      const { sut } = makeSut()
      sut.http.request.mockResolvedValueOnce({ status: 200 })

      const feedbackMessage = await sut.deleteUser(7816825367)

      expect(feedbackMessage).toBe('User successfully deleted')
    })

    it('should remove all users queries from cache after delete', async () => {
      const { sut } = makeSut()
      sut.http.request.mockResolvedValueOnce({ status: 200 })

      await sut.deleteUser(123)

      expect(sut.queryClient.removeQueries).toHaveBeenCalledWith({
        queryKey: ['users']
      })
    })
  })
})
