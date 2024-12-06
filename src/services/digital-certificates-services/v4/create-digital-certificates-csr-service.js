import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { makeDigitalCertificatesBaseUrl } from './make-digital-certificates-csr-base-url'
import { extractApiError } from '@/helpers/extract-api-error'

import * as Errors from '@/services/axios/errors'

export const createDigitalCertificatesCSRService = async (payload) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeDigitalCertificatesBaseUrl()}/csr`,
    method: 'POST',
    body: adapt(payload)
  })

  return parseHttpResponse(httpResponse)
}

const parseHttpResponse = (httpResponse) => {
  switch (httpResponse.statusCode) {
    case 201:
      return {
        feedback: 'Your digital certificate has been created!',
        urlToEditView: `/digital-certificates/edit/${httpResponse.body.data.id}`,
        digitalCertificateId: httpResponse.body.data.id
      }
    case 500:
      throw new Errors.InternalServerError().message
    default:
      throw new Error(extractApiError(httpResponse)).message
  }
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
    private_key_type: 'rsa_2048',
    alternative_names: payload.subjectAlternativeNames?.split('\n')
  }
}
