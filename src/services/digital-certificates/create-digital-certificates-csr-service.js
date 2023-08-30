import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter';
import { makeDigitalCertificatesBaseUrl } from './make-digital-certificates-base-url';

export const createDigitalCertificatesCSRService = async (payload) => {
    let httpResponse = await AxiosHttpClientAdapter
      .request({
        url: `${makeDigitalCertificatesBaseUrl()}/csr`,
        method: 'POST',
        body: adapt(payload),
      })

    return parseHttpResponse(httpResponse);
  }

const adapt = (payload) => {
  return {
    name: payload.digitalCertificateName,
    common_name: payload.common,
    locality: payload.city,
    state: payload.state,
    country: payload.country,
    organization: payload.organization,
    email: payload.email,
    organization_unity: payload.organizationUnity,
    private_key_type: payload.privateKeyType,
    sans: payload.subjectAlternativeNames?.split('\n'),
  }
}