import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'

const makeAccountSettingsBaseUrl = () => {
  const version = 'v4'
  return `${version}/iam/account`
}

export const updateAddressService = async (payload) => {
  const httpResponse = await AxiosHttpClientAdapter.request({
    url: makeAccountSettingsBaseUrl(),
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
  return parseHttpResponse(httpResponse)
}

const parseHttpResponse = (httpResponse) => {
  switch (httpResponse.statusCode) {
    case 200:
      return 'Address updated successfully'
    case 400:
      throw new Error(new Errors.InvalidApiRequestError().message)
    case 403:
      throw new Error(new Errors.PermissionError().message)
    case 404:
      throw new Error(new Errors.NotFoundError().message)
    case 500:
      throw new Error(new Errors.InternalServerError().message)
    default:
      throw new Error(new Errors.UnexpectedError().message)
  }
}
