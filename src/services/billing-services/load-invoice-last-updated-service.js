import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeBillingBaseUrl } from './make-billing-base-url'
import { formatDateToUSBilling } from '@/helpers/convert-date'

export const loadInvoiceLastUpdatedService = async () => {
  const payload = {
    query: `
    query getBillDetail {
      products: billDetail(
        groupBy: [createdDate],
        orderBy: [createdDate_DESC],
        limit: 1
      ) {
        last_updated: createdDate
      }
    }`
  }

  let httpResponse = await AxiosHttpClientAdapter.request({
    baseURL: '/',
    url: `${makeBillingBaseUrl()}`,
    method: 'POST',
    body: payload
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const { body, statusCode } = httpResponse

  const data = body.data?.products[0] || []
  const dataUpdated = formatDateToUSBilling(data.last_updated)

  return {
    body: dataUpdated ? `Last Updated: ${dataUpdated}` : '---',
    statusCode
  }
}
