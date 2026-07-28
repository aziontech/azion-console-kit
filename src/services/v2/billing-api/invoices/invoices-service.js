import { InvoicesAdapter } from './invoices-adapter'
import { BaseService } from '@/services/v2/base/query/baseService'
import { generateIdempotencyKey } from '@/services/v2/utils/idempotency-key'

export class InvoicesService extends BaseService {
  #baseURL = '/v4/account/billing/invoices'

  listInvoices = async (params = {}) => {
    const response = await this.http.request({
      method: 'GET',
      url: this.#baseURL,
      params: InvoicesAdapter.toListParams(params)
    })
    return InvoicesAdapter.transformListResponse(response.data)
  }

  getInvoice = async (invoiceId) => {
    const response = await this.http.request({
      method: 'GET',
      url: `${this.#baseURL}/${invoiceId}`
    })
    return InvoicesAdapter.transformDetailResponse(response.data)
  }

  listInvoiceLines = async (invoiceId) => {
    const response = await this.http.request({
      method: 'GET',
      url: `${this.#baseURL}/${invoiceId}/lines`
    })
    return InvoicesAdapter.transformLinesResponse(response.data)
  }

  getInvoicePdf = async (invoiceId) => {
    const response = await this.http.request({
      method: 'GET',
      url: `${this.#baseURL}/${invoiceId}/pdf`
    })
    return InvoicesAdapter.transformPdfResponse(response.data)
  }

  listInvoiceSettlements = async (invoiceId) => {
    const response = await this.http.request({
      method: 'GET',
      url: `${this.#baseURL}/${invoiceId}/settlements`
    })
    return InvoicesAdapter.transformSettlementsResponse(response.data)
  }

  payInvoice = async ({ invoiceId, payload, idempotencyKey } = {}) => {
    const response = await this.http.request({
      method: 'POST',
      url: `${this.#baseURL}/${invoiceId}/pay`,
      body: InvoicesAdapter.toPayPayload(payload),
      config: { headers: { 'idempotency-key': idempotencyKey ?? generateIdempotencyKey() } }
    })
    return response.data
  }
}

export const billingInvoicesService = new InvoicesService()
