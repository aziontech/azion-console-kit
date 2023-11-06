import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeSwitchAccountBaseUrl } from '@/services/auth-services/make-switch-account-base-url'
import { getAccountTypeIcon, getAccountTypeName } from '@/helpers/accountTypeNameMapping.js'

export const listTypeAccountService = async ({
  type = 'brands',
  textSnippet = '',
  page = 1,
  page_size = 5
}) => {
  const searchParams = makeSearchParams({ type, textSnippet, page, page_size })

  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeSwitchAccountBaseUrl()}?${searchParams.toString()}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse, type)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse, type) => {
  const { results = [], total_pages: totalPages } = httpResponse.body || {}

  const accounts = results.map((account) => ({
    name: {
      content: account.name
    },
    type: {
      content: getAccountTypeName(type),
      icon: getAccountTypeIcon(type),
      severity: 'info'
    },
    clientID: account.client_id || '-',
    id: account.id.toString(),
    accountId: account.id.toString()
  }))

  return {
    body: {
      results: accounts,
      totalPages
    },
    statusCode: httpResponse.statusCode
  }
}

const makeSearchParams = ({ type, textSnippet, page, page_size }) => {
  const searchParams = new URLSearchParams()
  searchParams.set('account_type', type)
  searchParams.set('q', textSnippet)
  searchParams.set('page', page)
  searchParams.set('page_size', page_size)
  return searchParams
}
