import { BaseService } from '@/services/v2/base/query/baseService'

export class ContractService extends BaseService {
  constructor() {
    super()
    this.baseURL = 'v3/contract'
  }

  async fetchContractServicePlan(clientId) {
    const response = await this.http.request({
      method: 'GET',
      url: `${this.baseURL}/${clientId}/products`,
      config: { baseURL: '/api' }
    })
    return this._adaptContractPlan(response.data)
  }

  getContractServicePlan(clientId, options = {}) {
    return this.queryAsync({
      key: ['contract', 'service-plan', clientId],
      queryFn: () => this.fetchContractServicePlan(clientId),
      cache: this.cacheType.GLOBAL,
      overrides: { refetchInterval: this.cacheTime.ONE_MINUTE, ...options }
    })
  }

  _adaptContractPlan(response) {
    const products = response || []
    const slugs = products?.map((product) => product.slug)

    const KEYWORDS = {
      CONTRACT: 'contract_',
      SUPPORT: 'support_',
      PLAN: 'plan_'
    }

    const isDeveloperSupportPlan = slugs.every((slug) => {
      return !slug.includes(KEYWORDS.PLAN) && !slug.includes(KEYWORDS.SUPPORT)
    })

    let yourServicePlan = 'Developer'

    if (!isDeveloperSupportPlan) {
      const contractProduct = products.filter(
        (product) =>
          product.slug.includes(KEYWORDS.CONTRACT) ||
          product.slug.includes(KEYWORDS.SUPPORT) ||
          product.slug.includes(KEYWORDS.PLAN)
      )

      contractProduct.forEach((product) => {
        const planType = this._extractWordFromSlug(product.slug)
        yourServicePlan = this._getPlanName(planType) || 'Developer'
      })
    }

    return { isDeveloperSupportPlan, yourServicePlan }
  }

  _extractWordFromSlug(slug) {
    const KEYWORDS = {
      CONTRACT: 'contract_',
      SUPPORT: 'support_',
      PLAN: 'plan_'
    }

    for (const keyword of Object.values(KEYWORDS)) {
      if (slug.includes(keyword)) {
        const extractedWord = slug.replace(keyword, '').split('_')[0]
        return extractedWord === 'mission' ? 'mission_critical' : extractedWord
      }
    }
    return ''
  }

  _getPlanName(planType) {
    const PLAN_MAP = {
      business: 'Business',
      enterprise: 'Enterprise',
      missioncritical: 'Mission Critical',
      mission_critical: 'Mission Critical'
    }
    return PLAN_MAP[planType]
  }
}

export const contractService = new ContractService()
