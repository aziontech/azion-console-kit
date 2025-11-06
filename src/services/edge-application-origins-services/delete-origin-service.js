import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import { makeEdgeApplicationBaseUrl } from '../edge-application-services/make-edge-application-base-url'
import * as Errors from '@/services/axios/errors'
import { useMutation } from '@tanstack/vue-query'
import { queryClient } from '@/services/v2/base/query/queryClient'
import { invalidateOriginsCache } from './list-origins-service'

const deleteOriginsServiceCore = async (originKey, id) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeApplicationBaseUrl()}/${id}/origins/${originKey}`,
    method: 'DELETE'
  })

  return parseHttpResponse(httpResponse)
}

/**
 * @param {string} payload.originKey - The origins Edge Application id.
 * @param {string} payload.id - The id of origins.
 * @returns {string} The result message based on the status code.
 */
export const deleteOriginsService = async (originKey, id) => {
  const result = await deleteOriginsServiceCore(originKey, id)
  await invalidateOriginsCache(id)
  return result
}

export const useDeleteOrigin = (options = {}) => {
  return useMutation(
    {
      mutationFn: ({ originKey, edgeApplicationId }) =>
        deleteOriginsServiceCore(originKey, edgeApplicationId),
      onSuccess: async (data, variables, context) => {
        await invalidateOriginsCache(variables.edgeApplicationId)

        if (options.onSuccess) {
          await options.onSuccess(data, variables, context)
        }
      },
      ...options
    },
    queryClient
  )
}

/**
 * @param {Object} httpResponse - The HTTP response object.
 * @param {String} httpResponse.statusCode - The HTTP status code.
 * @returns {string} The result message based on the status code.
 * @throws {Error} If there is an error with the response.
 */
const parseHttpResponse = (httpResponse) => {
  switch (httpResponse.statusCode) {
    case 204:
      return 'Origins successfully deleted'
    case 400:
      throw new Errors.NotFoundError().message
    case 401:
      throw new Errors.InvalidApiTokenError().message
    case 403:
      throw new Errors.PermissionError().message
    case 404:
      throw new Errors.NotFoundError().message
    case 409:
      throw new Error(httpResponse.body).message
    case 500:
      throw new Errors.InternalServerError().message
    default:
      throw new Errors.UnexpectedError().message
  }
}
