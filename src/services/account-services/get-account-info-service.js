import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeAccountBaseUrl } from './make-account-base-url'
import { getAccountTypeIcon, getAccountTypeName } from '@/helpers/account-type-name-mapping.js'

export const getAccountInfoService = async () => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeAccountBaseUrl()}`,
    method: 'GET'
  })
  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const { body } = httpResponse

  if (!body) return httpResponse

  body.accountTypeIcon = getAccountTypeIcon(body.kind)
  body.accountTypeName = getAccountTypeName(body.kind)

  return {
    body,
    ...httpResponse
  }
}
