import { FeedbackAdapter } from '@/services/v2/feedback/feedback-adapter'
import { BaseService } from '@/services/v2/base/query/baseService'

export class FeedbackService extends BaseService {
  #baseURL = 'webhook/console_feedback'

  create = async (payload) => {
    const body = FeedbackAdapter.transformPayload(payload)

    await this.http.request({
      method: 'POST',
      url: this.#baseURL,
      body,
      config: { baseURL: '/api' }
    })

    return 'Feedback sent successfully'
  }
}

export const feedbackService = new FeedbackService()
