import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { makeAccountDeleteBaseUrl } from './make-account-delete-base-url'
import * as Errors from '@/services/axios/errors'
import { extractApiError } from '@/helpers/extract-api-error'

export const deleteAccountService = async (id) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeAccountDeleteBaseUrl()}/${id}`,
    method: 'DELETE'
  })
  return parseHttpResponse(httpResponse)
}

const parseHttpResponse = (httpResponse) => {
  switch (httpResponse.statusCode) {
    case 204:
      return 'Your account has been deleted'
    case 500:
      throw new Errors.InternalServerError().message
    default:
      throw new Error(extractApiError(httpResponse)).message
  }
}
