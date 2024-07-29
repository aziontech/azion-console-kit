import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import graphQLApi from '../axios/makeGraphQl'
import { makeBillingBaseUrl } from './make-billing-base-url'
import { formatDateToUSBilling, getCurrentMonthStartEnd } from '@/helpers/convert-date'

export const loadInvoiceLastUpdatedService = async () => {
  const dateRange = getCurrentMonthStartEnd()
  const payload = {
    query: `
    query getBillDetail {
      products: billDetail(
        groupBy: [createdDate]
        filter: {
          periodFromRange: {
            begin: "${dateRange.dateInitial}", end: "${dateRange.dateFinal}"
          }
        }
      ) {
        last_updated: createdDate
      }
    }`
  }

  let httpResponse = await AxiosHttpClientAdapter.request(
    {
      url: `${makeBillingBaseUrl()}`,
      method: 'POST',
      body: payload
    },
    graphQLApi
  )

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {

  const { body, statusCode } = httpResponse

  return {
    body: `Last Updated: ${formatDateToUSBilling(body?.data?.products[0].last_updated)}` ?? [],
    statusCode
  }
}
