import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeContractBaseUrl } from './make-contract-base-url'

export const loadContractServicePlan = async ({ clientId }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeContractBaseUrl()}/${clientId}/products`,
    method: 'GET'
  })
  const parsedData = adapt(httpResponse)
  return parseHttpResponse(parsedData)
}

const PLAN_MAP = {
  business: 'Business',
  enterprise: 'Enterprise',
  mission_critical: 'Mission Critical'
}

function extractWordFromSlug(str) {
  const keyword = 'contract_'
  const index = str.indexOf(keyword)

  if (index !== -1) {
    const start = index + keyword.length
    const remainingStr = str.substring(start)
    const extractedWord = remainingStr !== 'mission_critical' ? remainingStr.split('_')[0] : remainingStr
    return extractedWord
  }

  return ''
}

const adapt = (httpResponse) => {
  let yourServicePlan = 'Developer'
  const products = httpResponse.body || []
  const slugs = products?.map((product) => product.slug)
  const isDeveloperSupportPlan = slugs.every((slug) => {
    return !slug.includes('plan_') && !slug.includes('support_')
  })

  if (!isDeveloperSupportPlan) {
    for (const product of products) {
      if (product.slug.includes('contract_')) {
        yourServicePlan = PLAN_MAP[extractWordFromSlug(product.slug)]
        break
      }
    }
  }

  return {
    body: { isDeveloperSupportPlan, yourServicePlan },
    statusCode: httpResponse.statusCode
  }
}
