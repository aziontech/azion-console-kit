import { isBillingV4Enabled } from '@/services/v2/billing-api/billing-v4-flag'
import { billingLegacyRoutes } from './billing-legacy-routes'
import { billingV4Routes } from './billing-v4-routes'

/** @type {import('vue-router').RouteRecordRaw} */
export const billingRoutes = isBillingV4Enabled() ? billingV4Routes : billingLegacyRoutes
