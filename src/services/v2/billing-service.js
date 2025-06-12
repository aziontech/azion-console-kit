export class PaymentService {
  constructor(http, adapter) {
    this.http = http
    this.adapter = adapter
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
