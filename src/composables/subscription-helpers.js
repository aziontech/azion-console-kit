import { SO_STATUS } from '@/services/v2/service-orders/service-orders-constants'
import { formatDateToUSBilling } from '@/helpers/convert-date'

export const isActiveServiceOrder = (so) => so?.status === SO_STATUS.ACTIVE

export const findPlanById = (plans, planId) => {
  if (!planId || !Array.isArray(plans)) return null
  return plans.find((plan) => plan.id === planId) ?? null
}

export const findPricingById = (plans, priceId) => {
  if (!priceId || !Array.isArray(plans)) return null
  for (const plan of plans) {
    const pricing = plan.pricings?.find((item) => item.id === priceId)
    if (pricing) return pricing
  }
  return null
}

export const resolvePlanSku = (plan) => plan?.sku?.toLowerCase() ?? null

export const toFiniteNumber = (value, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export const formatPlanStartDate = (rawDate) => {
  if (!rawDate) return null
  const dateOnly = String(rawDate).slice(0, 10)
  const formatted = formatDateToUSBilling(dateOnly)
  return formatted === '---' ? null : formatted
}
