import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import { makeDigitalCertificatesBaseUrl } from './make-digital-certificates-base-url'
import * as Errors from '@/services/axios/errors'

export const createDigitalCertificatesService = async (payload) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeDigitalCertificatesBaseUrl()}`,
    method: 'POST',
    body: adapt(payload)
  })

  return parseHttpResponse(httpResponse)
}

/**
 * @param {Object} body - The response body.
 * @returns {string} The result message based on the status code.
 */
const extractApiError = (body) => {
  let apiError = ''
  const keys = Object.keys(body)

  for (const keyError of keys) {
    if (Array.isArray(body[keyError])) {
      const errorValue = body[keyError][0]
      if (typeof errorValue === 'string') {
        apiError = errorValue
        break
      }
      if (typeof errorValue === 'object') {
        apiError = errorValue.message[0]
        break
      }
    } else {
      apiError = body[keyError]
      break
    }
  }

  return apiError
}

const parseHttpResponse = (httpResponse) => {
  switch (httpResponse.statusCode) {
    case 201:
      return {
        feedback: 'Your digital certificate has been created!',
        urlToEditView: `/digital-certificates/edit/${httpResponse.body.results.id}`,
        domainId: httpResponse.body.results.id
      }
    case 400:
      throw new Error(extractApiError(httpResponse.body)).message
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

const validateCertificateFields = ({ certificate, privateKey }) => {
  const hasCertificate = !!certificate?.trim()
  const hasPrivateKey = !!privateKey?.trim()

  if (!hasCertificate && !hasPrivateKey) return {}

  if (!hasPrivateKey) return { certificate }

  if (!hasCertificate) return { private_key: privateKey }

  return {
    certificate,
    private_key: privateKey
  }
}

const adapt = (payload) => {
  return {
    name: payload.digitalCertificateName,
    certificate_type: payload.certificateType,
    ...validateCertificateFields({
      certificate: payload.certificate,
      privateKey: payload.privateKey
    })
  }
}
