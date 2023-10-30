import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeSwitchAccountBaseUrl } from '@/services/auth-services/make-switch-account-base-url'

export const listTypeAccountService = async ({ type = 'resellers', snippet = '', page = 1 }) => {
  const searchParams = makeSearchParams({ type, snippet, page })

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
    name: account.name,
    type: {
      icon: ICON_TYPE_ACCOUNT[type],
      content: NAME_TYPE_ACCOUNT[type]
    },
    id: account.id
  }))

  return {
    body: {
      accounts,
      totalPages
    },
    statusCode: httpResponse.statusCode
  }
}

const makeSearchParams = ({ type, snippet, page }) => {
  const searchParams = new URLSearchParams()
  searchParams.set('account_type', type)
  searchParams.set('q', snippet)
  searchParams.set('page', page)
  return searchParams
}
