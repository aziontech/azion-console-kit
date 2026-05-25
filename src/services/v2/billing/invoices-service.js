import { BaseService } from '@/services/v2/base/query/baseService'
import { InvoicesAdapter } from './invoices-adapter'

export class InvoicesService extends BaseService {
  #baseURL = '/edge_api/api/v1/account/invoices'

  listAccountInvoices = async () => {
    const response = await this.http.request({
      method: 'GET',
      url: this.#baseURL
    })

    const data = response?.data ?? {}
    return {
      invoices: Array.isArray(data.invoices) ? data.invoices : [],
      hasMore: Boolean(data.has_more)
    }
  }

  listAccountInvoicesAsRows = async ({ statusMap } = {}) => {
    const { invoices, hasMore } = await this.listAccountInvoices()
    return {
      rows: InvoicesAdapter.transformInvoicesList(invoices, statusMap),
      hasMore
    }
  }
}

export const invoicesService = new InvoicesService()
