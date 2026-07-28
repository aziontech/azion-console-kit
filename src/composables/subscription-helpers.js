import { formatDateToUSBilling } from '@/helpers/convert-date'

export const findPlanById = (plans, planId) => {
  if (!planId || !Array.isArray(plans)) return null
  return plans.find((plan) => plan.id === planId) ?? null
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
