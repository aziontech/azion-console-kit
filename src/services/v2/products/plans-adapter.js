const transformPricing = (pricing = {}) => ({
  id: pricing.plan_pricing_id ?? pricing.id,
  currencyCode: pricing.currency_code,
  priceValue: pricing.price_value,
  periodicity: pricing.periodicity,
  active: pricing.active,
  validFrom: pricing.valid_from
})

const transformPlan = (item = {}) => ({
  id: item.plan_id ?? item.id,
  fallbackPlanId: item.fallback_plan_id ?? null,
  name: item.name,
  slug: item.slug ?? null,
  sku: item.sku,
  description: item.description,
  type: item.type,
  status: item.status,
  active: item.active,
  sortOrder: item.sort_order,
  eolDate: item.eol_date ?? null,
  revision: item.revision,
  publishedRevision: item.published_revision ?? null,
  publishedPublicationId: item.published_publication_id ?? null,
  reqContract: item.req_contract,
  trialCreditValue: item.trial_credit_value ?? null,
  trialCreditDurationDays: item.trial_credit_duration_days ?? null,
  trialCreditCurrency: item.trial_credit_currency ?? null,
  supportsReservedCapacity: item.supports_reserved_capacity,
  supportsSavingsPlan: item.supports_savings_plan,
  supportsOnDemand: item.supports_on_demand,
  supportsSpendManagement: item.supports_spend_management,
  isInternal: item.is_internal,
  deletedAt: item.deleted_at ?? null,
  deletedBy: item.deleted_by ?? null,
  isPublicCatalog: item.is_public_catalog,
  allowSelfService: item.allow_self_service,
  requiresManualApproval: item.requires_manual_approval,
  whitelistOnly: item.whitelist_only,
  externalProductId: item.external_product_id ?? null,
  audit: {
    lastEditor: item.audit?.last_editor ?? item.last_editor ?? null,
    lastModified: item.audit?.last_modified ?? item.last_modified ?? null,
    createdAt: item.audit?.created_at ?? item.created_at ?? null
  },
  pricings: Array.isArray(item.pricings) ? item.pricings.map(transformPricing) : []
})

const transformPlansList = (data) => {
  const plans = Array.isArray(data) ? data : data?.results
  return Array.isArray(plans) ? plans.map(transformPlan) : []
}

export const ProductsPlansAdapter = {
  transformPlan,
  transformPricing,
  transformPlansList
}
