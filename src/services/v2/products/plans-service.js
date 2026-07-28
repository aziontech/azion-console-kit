import { BaseService } from '@/services/v2/base/query/baseService'
import { ProductsPlansAdapter } from './plans-adapter'
import { PLANS_MOCK_RESPONSE } from './plans-mock'

const USE_MOCK = true

const PLANS_ENDPOINTS = {
  production: 'https://products-api.azion.net/plans',
  stage: 'https://stage-products-api.azion.net/plans'
}

const resolvePlansUrl = () => {
  const isProduction = import.meta.env.MODE === 'production'
  return isProduction ? PLANS_ENDPOINTS.production : PLANS_ENDPOINTS.stage
}

export class ProductsPlansService extends BaseService {
  listPlans = async () => {
    if (USE_MOCK) {
      return ProductsPlansAdapter.transformPlansList(PLANS_MOCK_RESPONSE)
    }

    const response = await this.http.request({
      method: 'GET',
      url: resolvePlansUrl()
    })
    return ProductsPlansAdapter.transformPlansList(response.data)
  }
}

export const productsPlansService = new ProductsPlansService()
