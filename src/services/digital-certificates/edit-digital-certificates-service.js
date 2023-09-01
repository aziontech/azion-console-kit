import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter';
import { makeDigitalCertificatesBaseUrl } from './make-digital-certificates-base-url';

export const editDigitalCertificateService = async (payload) => {
  const parsedPayload = adapt(payload)
  let httpResponse = await AxiosHttpClientAdapter
    .request({
      url: `${makeDigitalCertificatesBaseUrl()}/${payload.id}`,
      method: 'PATCH',
      body: parsedPayload
    })

  return parseHttpResponse(httpResponse)
}

const adapt = (payload) => {
  return {
    name: payload.name,
    certificate: payload.certificate,
    private_key: payload.privateKey
  }
}