export class PaymentService {
  constructor(http, adapter) {
    this.http = http
    this.adapter = adapter
    this.baseURL = {
      creditCards: 'v4/payments/credit_cards',
      credits: 'v4/payments/credits',
      history: 'v4/payments/history'
    }
  }

  listCreditCards = async (params = { pageSize: 200 }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.baseURL.creditCards}`,
      params
    })

    const { results, count } = data

    const body = this.adapter?.transformListCreditCards?.(results) ?? results

    return {
      count,
      body
    }
  }

  createCreditCard = async (payload) => {
    await this.http.request({
      method: 'POST',
      url: `${this.baseURL.creditCards}`,
      body: payload
    })
    return {
      feedback: 'Your Payment Method has been added'
    }
  }

  getCreditCard = async (id) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.baseURL.creditCards}/${id}`
    })
    return data.data
  }

  editCreditCard = async (id, payload) => {
    const { data } = await this.http.request({
      method: 'PATCH',
      url: `${this.baseURL.creditCards}/${id}`,
      body: payload
    })

    return data.data
  }

  deleteCreditCard = async (id) => {
    await this.http.request({
      method: 'DELETE',
      url: `${this.baseURL.creditCards}/${id}`
    })

    return 'Payment Method successfully deleted!'
  }

  addCredit = async ({ amount }) => {
    await this.http.request({
      method: 'POST',
      url: `${this.baseURL.credits}`,
      body: { amount }
    })
    return 'Credit added successfully.'
  }

  listPaymentsHistory = async (params = { pageSize: 200 }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.baseURL.history}`,
      params
    })
    return data.results
  }
}
