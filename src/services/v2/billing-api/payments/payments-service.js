import { PaymentsAdapter } from './payments-adapter'
import { BaseService } from '@/services/v2/base/query/baseService'
import { queryKeys } from '@/services/v2/base/query/queryKeys'

export class PaymentsService extends BaseService {
  #baseURL = '/v4/account/payments'

  listPayments = async (params = {}) => {
    const response = await this.http.request({
      method: 'GET',
      url: this.#baseURL,
      params: PaymentsAdapter.toListParams(params)
    })
    return PaymentsAdapter.transformListResponse(response.data)
  }

  useListPaymentsQuery(params = {}) {
    return this.useQuery(queryKeys.payments.list(params), () => this.listPayments(params))
  }

  getPayment = async (id) => {
    const response = await this.http.request({
      method: 'GET',
      url: `${this.#baseURL}/${id}`
    })
    return PaymentsAdapter.transformDetailResponse(response.data)
  }

  useGetPaymentQuery(id) {
    return this.useQuery(queryKeys.payments.detail(id), () => this.getPayment(id))
  }
}

export const paymentsService = new PaymentsService()
