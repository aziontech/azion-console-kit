import { BaseService } from '@/services/v2/base/query/baseService'
import { serviceOrdersService } from '@/services/v2/service-orders/service-orders-service'

const NOT_FOUND_STATUS = 404

const isNotFound = (error) =>
  error?.statusCode === NOT_FOUND_STATUS ||
  error?.response?.status === NOT_FOUND_STATUS ||
  error?.status === NOT_FOUND_STATUS

export class AccountCurrentService extends BaseService {
  fetchCurrentServiceOrder = async () => {
    try {
      const response = await serviceOrdersService.getCurrentServiceOrder()
      return { data: response?.data ?? null }
    } catch (error) {
      if (isNotFound(error)) return { data: null }
      throw error
    }
  }

  fetchCurrentPlan = async () => {
    try {
      const response = await serviceOrdersService.getCurrentPlan()
      return { data: response?.data ?? null }
    } catch (error) {
      if (isNotFound(error)) return { data: null }
      throw error
    }
  }
}

export const accountCurrentService = new AccountCurrentService()
