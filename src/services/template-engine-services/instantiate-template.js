import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import { makeTemplateEngineBaseUrl } from './make-template-engine-base-url'
import * as Errors from '@/services/axios/errors'

export const instantiateTemplate = async (templateId, body) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeTemplateEngineBaseUrl()}/templates/${templateId}/instantiate`,
    method: 'POST',
    body: body
  })
  return parseHttpResponse(httpResponse)
}

const parseHttpResponse = (httpResponse) => {
  switch (httpResponse.statusCode) {
    case 201:
      return {
        result: httpResponse.body,
        feedback: 'Integration installation was successful'
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
