import { parsePascalToSnake } from '@/helpers/parse-api-body'
import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeAccountIamBaseUrl } from './make-account-base-url'

export const updateAccountSettings = async (payload) => {
  payload = {
    ...payload,
    countryId: payload.country.id,
    regionId: payload.region.id,
    cityId: payload.city.id
  }

  delete payload.country
  delete payload.region
  delete payload.city
  delete payload.companySize

  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeAccountIamBaseUrl()}`,
    method: 'PATCH',
    body: parsePascalToSnake(payload)
  })

  httpResponse = await adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = async (httpResponse) => {
  return {
    statusCode: httpResponse.statusCode
  }
}
