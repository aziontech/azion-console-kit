import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeResetPasswordBaseUrl } from './make-reset-password-base-url'

export const sendResetPasswordEmailService = async (payload) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeResetPasswordBaseUrl()}/request`,
    method: 'POST',
    body: adapt(payload)
  })
  return parseHttpResponse(httpResponse)
}

const adapt = (payload) => {
  return {
    email: payload.email
  }
}
