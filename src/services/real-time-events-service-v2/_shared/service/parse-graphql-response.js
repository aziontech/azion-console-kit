import * as Errors from '@/services/axios/errors'

/**
 * Single source of truth for the GraphQL HTTP status-code switch shared by the
 * Real-Time Events v2 service files. The success branch (status 200) is delegated
 * to the caller via `on200`, so each service keeps its own `adaptResponse` shape
 * while reusing the identical error handling.
 *
 * Preserves the exact legacy throw semantics per branch (byte-equivalent):
 * - 400: `throw new Error(body.detail).message` (throws the string message)
 * - 401: `throw new Errors.InvalidApiTokenError().message`
 * - 403: `throw new Error(body.detail).message`
 * - 404: `throw new Errors.NotFoundError().message`
 * - 500: `throw new Errors.InternalServerError().message`
 * - default: `throw new Errors.UnexpectedError().message`
 *
 * @param {{ body: any, statusCode: number }} response - The HTTP response object.
 * @param {(body: any) => any} on200 - Success handler invoked with `response.body`.
 * @return {any} The value returned by `on200` when the status code is 200.
 */
export const parseGraphQLResponse = (response, on200) => {
  const { body, statusCode } = response

  switch (statusCode) {
    case 200:
      return on200(body)
    case 400:
      const apiError = body.detail
      throw new Error(apiError).message
    case 401:
      throw new Errors.InvalidApiTokenError().message
    case 403:
      const forbiddenError = body.detail
      throw new Error(forbiddenError).message
    case 404:
      throw new Errors.NotFoundError().message
    case 500:
      throw new Errors.InternalServerError().message
    default:
      throw new Errors.UnexpectedError().message
  }
}
