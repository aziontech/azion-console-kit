import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import { makeTemplateEngineBaseUrl } from './make-template-engine-base-url'
import * as Errors from '@/services/axios/errors'

export const instantiateTemplate = async (templateId, payload) => {
  const applicationName = payload.find((item) => item.field === 'az_name')?.value

  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeTemplateEngineBaseUrl()}/templates/${templateId}/instantiate`,
    method: 'POST',
    body: payload
  })
  return parseHttpResponse(httpResponse, applicationName)
}

const parseHttpResponse = (httpResponse, applicationName) => {
  switch (httpResponse.statusCode) {
    case 201:
      return {
        result: httpResponse.body,
        feedback: 'Integration installation was successful',
        urlToEditView: generateRedirectUrl(httpResponse.body.uuid, applicationName)
      }
    case 400:
      const apiError = httpResponse.body.error[0]
      throw new Error(apiError).message
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

const generateRedirectUrl = (uuid, applicationName) => {
  const hasApplicationName = !!applicationName

  if (hasApplicationName) {
    return `/create/deploy/${uuid}`
  }

  return `/create/deploy/${uuid}/${applicationName}`
}
