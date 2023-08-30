import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter';
import { makeDigitalCertificatesBaseUrl } from './make-digital-certificates-base-url';

export const createDigitalCertificatesService = async (payload) => {
    let httpResponse = await AxiosHttpClientAdapter
      .request({
        url: `${makeDigitalCertificatesBaseUrl()}`,
        method: 'POST',
        body: adapt(payload),
      })

    return parseHttpResponse(httpResponse);
  }

const adapt = (payload) => {
  let adaptReturn = {
    name: payload.digitalCertificateName,
    certificate_type: payload.certificateType,
    certificate: payload.certificate,
  }

  const hasPrivateKey = (payload.certificateType === 'edge_certificate' && !!payload.privateKey)
  if (hasPrivateKey) {
    adaptReturn = { ...adaptReturn, private_key: payload.privateKey }
  }

  return adaptReturn
}