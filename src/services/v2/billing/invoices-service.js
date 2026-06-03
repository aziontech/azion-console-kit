import { BaseService } from '@/services/v2/base/query/baseService'
import { InvoicesAdapter } from './invoices-adapter'

const MAX_LIMIT = 100

export class InvoicesService extends BaseService {
  #baseURL = '/edge_api/v4/service_orders/billing/invoices'

  listAccountInvoices = async ({ limit = MAX_LIMIT, startingAfter } = {}) => {
    const response = await this.http.request({
      method: 'GET',
      url: this.#baseURL,
      params: {
        limit,
        ...(startingAfter && { starting_after: startingAfter })
      }
    })

    const body = response?.data ?? {}
    return {
      invoices: Array.isArray(body.data) ? body.data : [],
      hasMore: Boolean(body.has_more),
      nextStartingAfter: body.next_starting_after ?? null,
      stale: Boolean(body.stale)
    }
  }

  listAccountInvoicesAsRows = async ({ statusMap, limit, startingAfter } = {}) => {
    const { invoices, hasMore, nextStartingAfter, stale } = await this.listAccountInvoices({
      limit,
      startingAfter
    })
    return {
      rows: InvoicesAdapter.transformInvoicesList(invoices, statusMap),
      hasMore,
      nextStartingAfter,
      stale
    }
  }
}

export const invoicesService = new InvoicesService()
