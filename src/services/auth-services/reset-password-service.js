import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeResetPasswordBaseUrl } from './make-reset-password-base-url'

export const resetPasswordService = async (payload) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeResetPasswordBaseUrl()}/new`,
    method: 'POST',
    body: adapt(payload)
  })
  return parseHttpResponse(httpResponse)
}

const adapt = (payload) => {
  return {
    password: payload.password,
    uidb64: payload.uidb64,
    token: payload.token
  }
}
