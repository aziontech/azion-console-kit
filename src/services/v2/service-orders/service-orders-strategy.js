import { PATCH_DRAFT_WINDOW_MS, SO_STATUS } from './service-orders-constants'

export const SUBMIT_ACTIONS = Object.freeze({
  CREATE: 'create',
  PATCH: 'patch',
  UPGRADE: 'upgrade',
  NOOP: 'noop'
})

export const isDraftPatchable = (so) => {
  if (!so || so.status !== SO_STATUS.DRAFT) return false
  const createdAt = so.createdAt ? Date.parse(so.createdAt) : NaN
  if (!Number.isFinite(createdAt)) return true
  return Date.now() - createdAt < PATCH_DRAFT_WINDOW_MS
}

export const resolveSubmitStrategy = ({ currentSO, planId, planPricingId }) => {
  if (!currentSO) return { action: SUBMIT_ACTIONS.CREATE }

  if (isDraftPatchable(currentSO)) return { action: SUBMIT_ACTIONS.PATCH }

  if (currentSO.status === SO_STATUS.DRAFT) return { action: SUBMIT_ACTIONS.CREATE }

  const isPlanChange = currentSO.planId !== planId
  if (isPlanChange) return { action: SUBMIT_ACTIONS.UPGRADE }

  const isPriceChange = Boolean(planPricingId) && currentSO.priceId !== planPricingId
  if (isPriceChange) return { action: SUBMIT_ACTIONS.UPGRADE }

  return { action: SUBMIT_ACTIONS.NOOP }
}
