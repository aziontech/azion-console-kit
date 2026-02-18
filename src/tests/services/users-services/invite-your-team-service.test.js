import { UsersService } from '@/services/v2/users/users-service'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/stores/account', () => ({
  useAccountStore: () => ({
    accountData: { user_id: 999 }
  })
}))

const fixtures = {
  guest: {
    name: 'Jack Caffe',
    email: 'jackcaffe@bmail.com',
    team: 10
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
  describe('inviteTeamMember', () => {
    it('should call API with correct params', async () => {
      const { sut } = makeSut()
      sut.http.request.mockResolvedValueOnce({ status: 201 })

      await sut.inviteTeamMember(fixtures.guest)

      expect(sut.http.request).toHaveBeenCalledWith({
        url: 'v4/iam/users',
        method: 'POST',
        body: {
          first_name: 'Jack',
          last_name: 'Caffe',
          email: fixtures.guest.email,
          teams_ids: [fixtures.guest.team]
        }
      })
    })

    it('should return a feedback message on successfully invited', async () => {
      const { sut } = makeSut()
      sut.http.request.mockResolvedValueOnce({ status: 201 })

      const feedbackMessage = await sut.inviteTeamMember(fixtures.guest)

      expect(feedbackMessage).toBe('Invite sent successfully')
    })

    it('should remove all users queries from cache after invite', async () => {
      const { sut } = makeSut()
      sut.http.request.mockResolvedValueOnce({ status: 201 })

      await sut.inviteTeamMember(fixtures.guest)

      expect(sut.queryClient.removeQueries).toHaveBeenCalledWith({
        queryKey: ['users']
      })
    })
  })
})
