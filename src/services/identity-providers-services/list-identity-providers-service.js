import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeIdentityProvidersBaseUrl } from './make-identity-providers-base-url'

export const listIdentityProvidersService = async () => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeIdentityProvidersBaseUrl()}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const results = httpResponse.body || []

  let hasActiveProvider = false

  const parsed = results.map((item) => {
    if (item.is_active) {
      hasActiveProvider = true
    }
    return {
      name: {
        text: item.name,
        tagProps: item.is_active
          ? {
              value: 'Active',
              severity: 'success'
            }
          : {}
      },
      protocol: item.protocol,
      id: item.uuid,
      isActive: item.is_active
    }
  })
  parsed.push({
    name: {
      text: 'Azion SSO',
      tagProps: !hasActiveProvider
        ? {
            value: 'Active',
            severity: 'success'
          }
        : {}
    },
    protocol: 'Internal Identity Source',
    id: 'azion-default-sso',
    isActive: !hasActiveProvider
  })

  const responseDataSorted = parsed.sort((currentCard, nextCard) => {
    return nextCard.isActive - currentCard.isActive
  })
  return {
    body: responseDataSorted,
    statusCode: httpResponse.statusCode
  }
}
