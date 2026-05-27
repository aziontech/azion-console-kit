import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'

const ENDPOINT = 'v4/iam/account'

const ERROR_BY_STATUS = {
  400: Errors.InvalidApiRequestError,
  403: Errors.PermissionError,
  404: Errors.NotFoundError,
  500: Errors.InternalServerError
}

export const updateAddressService = async (payload) => {
  const httpResponse = await AxiosHttpClientAdapter.request({
    url: ENDPOINT,
    method: 'PATCH',
    body: {
      postal_code: payload.postalCode,
      country: payload.country,
      region: payload.region,
      city: payload.city,
      address: payload.address,
      complement: payload.complement
    }
  })

  if (httpResponse.statusCode === 200) return

  const ErrorClass = ERROR_BY_STATUS[httpResponse.statusCode] ?? Errors.UnexpectedError
  throw new Error(new ErrorClass().message)
}
