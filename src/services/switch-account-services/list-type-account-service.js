import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeSwitchAccountBaseUrl } from '@/services/auth-services/make-switch-account-base-url'

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

  const ICON_TYPE_ACCOUNT = {
    clients: 'pi pi-box',
    groups: 'pi pi-folder',
    resellers: 'pi pi-building',
    brands: 'pi pi-globe'
  }

  const NAME_TYPE_ACCOUNT = {
    clients: 'Client',
    groups: 'Group',
    resellers: 'Reseller',
    brands: 'Brand'
  }

  const accounts = results.map((account) => ({
    name: {
      content: account.name
    },
    type: {
      content: {
        value: NAME_TYPE_ACCOUNT[type],
        icon: ICON_TYPE_ACCOUNT[type],
        severity: ''
      }
    },
    client_id: {
      content: '-'
    },
    id: {
      content: account.id.toString()
    },
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
