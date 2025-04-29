import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { makeCustomPagesBaseUrl } from './make-custom-pages-base-url'
import * as Errors from '@/services/axios/errors'
import { extractApiError } from '@/helpers/extract-api-error'

export const deleteCustomPagesService = async (id) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeCustomPagesBaseUrl()}/${id}`,
    method: 'DELETE'
  })

  return parseHttpResponse(httpResponse)
}

const parseHttpResponse = (httpResponse) => {
  switch (httpResponse.statusCode) {
    case 202:
      return 'Custom Page successfully deleted!'
    case 500:
      throw new Errors.InternalServerError().message
    default:
      throw new Error(extractApiError(httpResponse)).message
  }
}