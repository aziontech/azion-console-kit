import { httpService } from '@/services/v2/base/http/httpService'
import { feedbackService } from '@/services/v2/feedback'
import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('@/services/v2/base/http/httpService')

const fixtures = {
  formPayload: {
    type: 'issue',
    accountId: '123',
    clientId: '456',
    name: 'João Silva',
    email: 'joao@exemplo.com',
    description: 'Descrição do problema'
  }
}

describe('FeedbackService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('create', () => {
    it('should call the API with the adapted payload', async () => {
      const requestSpy = vi.spyOn(httpService, 'request').mockResolvedValueOnce({
        statusCode: 200
      })

      await feedbackService.create(fixtures.formPayload)

      expect(requestSpy).toHaveBeenCalledWith({
        method: 'POST',
        url: 'webhook/console_feedback',
        body: {
          type: 'issue',
          account_id: '123',
          client_id: '456',
          name: 'João Silva',
          email: 'joao@exemplo.com',
          description: 'Descrição do problema'
        },
        config: { baseURL: '/api' }
      })
    })

    it('should return the success message', async () => {
      vi.spyOn(httpService, 'request').mockResolvedValueOnce({ statusCode: 200 })

      const result = await feedbackService.create(fixtures.formPayload)

      expect(result).toBe('Feedback sent successfully')
    })

    it('should propagate the error when the request fails', async () => {
      const error = new Error('Request failed')
      vi.spyOn(httpService, 'request').mockRejectedValueOnce(error)

      await expect(feedbackService.create(fixtures.formPayload)).rejects.toThrow('Request failed')
    })
  })
})
