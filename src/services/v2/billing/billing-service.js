import { BaseService } from '@/services/v2/base/query/baseService'

export class PaymentService extends BaseService {
  constructor() {
    super()
    this.baseURL = 'v4/billing/invoices'
  }

  listInvoices = async (params = { pageSize: 200 }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.baseURL}`,
      params
    })
    return data.results
  }
}

export const paymentService = new PaymentService()
