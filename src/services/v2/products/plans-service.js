import { ProductsPlansAdapter } from './plans-adapter'
import plansCatalog from './plans.json'

export class ProductsPlansService {
  listPlans = async () => {
    return ProductsPlansAdapter.transformPlansList(plansCatalog)
  }
}

export const productsPlansService = new ProductsPlansService()
