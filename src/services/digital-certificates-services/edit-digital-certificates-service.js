import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import { makeDigitalCertificatesBaseUrl } from './make-digital-certificates-base-url'
import * as Errors from '@/services/axios/errors'
import { errorMsg } from './msg-error'

export const editDigitalCertificateService = async (payload) => {
  const parsedPayload = adapt(payload)
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeDigitalCertificatesBaseUrl()}/${payload.id}`,
    method: 'PATCH',
    body: parsedPayload
  })

  return parseHttpResponse(httpResponse)
}

const parseHttpResponse = (httpResponse) => {
  switch (httpResponse.statusCode) {
    case 200:
      return 'Your digital certificate has been updated!'
    case 400:
      throw new Error(errorMsg(httpResponse.body))
    case 401:
      throw new Errors.InvalidApiTokenError().message
    case 403:
      throw new Errors.PermissionError().message
    case 404:
      throw new Errors.NotFoundError().message
    case 500:
      throw new Errors.InternalServerError().message
    default:
      throw new Errors.UnexpectedError().message
  }
}

const adapt = (payload) => {
  return {
    name: payload.name,
    certificate: payload.certificate,
    private_key: payload.privateKey === '' ? undefined : payload.privateKey
  }
}
