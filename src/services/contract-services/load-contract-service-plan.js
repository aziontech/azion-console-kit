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

const KEYWORDS = {
  CONTRACT: 'contract_',
  SUPPORT: 'support_',
  PLAN: 'plan_'
}

function extractWordFromSlug(slug) {
  for (const keyword of Object.values(KEYWORDS)) {
    if (slug.includes(keyword)) {
      const extractedWord = slug.replace(keyword, '').split('_')[0]
      return extractedWord === 'mission' ? 'mission_critical' : extractedWord
    }
  }
  return ''
}

const adapt = (httpResponse) => {
  const products = httpResponse.body || []
  const slugs = products?.map((product) => product.slug)

  const isDeveloperSupportPlan = slugs.every((slug) => {
    return !slug.includes(KEYWORDS.PLAN) && !slug.includes(KEYWORDS.SUPPORT)
  })

  let yourServicePlan = 'Developer'

  if (!isDeveloperSupportPlan) {
    const contractProduct = products.find(product =>
      product.slug.includes(KEYWORDS.CONTRACT) || product.slug.includes(KEYWORDS.SUPPORT)
    )

    if (contractProduct) {
      const planType = extractWordFromSlug(contractProduct.slug)
      yourServicePlan = PLAN_MAP[planType] || 'Developer'
    }
  }

  return {
    body: { isDeveloperSupportPlan, yourServicePlan },
    statusCode: httpResponse.statusCode
  }
}
