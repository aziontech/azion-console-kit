const pick = (value, fallback) => (value !== undefined ? value : fallback)

const hasServiceOrderData = (data = {}) => {
  if (!data || typeof data !== 'object') return false

  return Boolean(
    pick(data.serviceOrderId, data.service_order_id) ||
      pick(data.accountId, data.account_id) ||
      pick(data.planId, data.plan_id)
  )
}

const getServiceOrderData = (response = {}) => {
  const data = response.data ?? response.results
  if (hasServiceOrderData(data)) return data
  if (hasServiceOrderData(response)) return response
}

export const ServiceOrdersAdapter = {
  transformPricing(pricing = {}) {
    return {
      id: pricing.plan_pricing_id,
      currencyCode: pricing.currency_code,
      priceValue: pricing.price_value,
      periodicity: pricing.periodicity,
      active: pricing.active,
      validFrom: pricing.valid_from
    }
  },

  transformPlan(item = {}) {
    return {
      id: item.plan_id,
      fallbackPlanId: item.fallback_plan_id,
      name: item.name,
      slug: item.slug,
      sku: item.sku,
      description: item.description,
      type: item.type,
      status: item.status,
      eolDate: item.eol_date,
      revision: item.revision,
      publishedRevision: item.published_revision,
      publishedPublicationId: item.published_publication_id,
      reqContract: item.req_contract,
      trialCreditValue: item.trial_credit_value,
      trialCreditDurationDays: item.trial_credit_duration_days,
      trialCreditCurrency: item.trial_credit_currency,
      supportsReservedCapacity: item.supports_reserved_capacity,
      supportsSavingsPlan: item.supports_savings_plan,
      isInternal: item.is_internal,
      sortOrder: item.sort_order,
      active: item.active,
      deletedAt: item.deleted_at,
      deletedBy: item.deleted_by,
      isPublicCatalog: item.is_public_catalog,
      allowSelfService: item.allow_self_service,
      requiresManualApproval: item.requires_manual_approval,
      whitelistOnly: item.whitelist_only,
      externalProductId: item.external_product_id,
      audit: {
        lastEditor: item.audit?.last_editor,
        lastModified: item.audit?.last_modified,
        createdAt: item.audit?.created_at
      },
      pricings: Array.isArray(item.pricings)
        ? item.pricings.map((pricing) => this.transformPricing(pricing))
        : []
    }
  },

  transformPlansList(data) {
    const plans = Array.isArray(data) ? data : data?.results
    if (!Array.isArray(plans)) return []

    return plans.map((item) => this.transformPlan(item))
  },

  transformServiceOrder(data = {}) {
    const metadata = data.metadata ?? {}
    // Backend stores the live Stripe checkout session under the SO so the
    // drawer can resume an unconfirmed payment instead of issuing a new
    // PATCH (which the backend rejects while the previous payment is still
    // being confirmed). The field can land in metadata, at the SO root, or
    // nested under payment/session/checkout — search all of them.
    const findClientSecret = (obj) => {
      if (!obj || typeof obj !== 'object') return null
      return (
        pick(
          obj.checkoutSessionClientSecret,
          pick(obj.checkout_session_client_secret, pick(obj.clientSecret, obj.client_secret))
        ) ?? null
      )
    }
    const clientSecret =
      findClientSecret(metadata) ??
      findClientSecret(data) ??
      findClientSecret(data.payment) ??
      findClientSecret(data.session) ??
      findClientSecret(data.checkout) ??
      findClientSecret(data.stripe) ??
      null

    const findCheckoutSessionId = (obj) => {
      if (!obj || typeof obj !== 'object') return null
      return pick(obj.checkoutSessionId, obj.checkout_session_id) ?? null
    }
    const checkoutSessionId =
      findCheckoutSessionId(metadata) ??
      findCheckoutSessionId(data) ??
      findCheckoutSessionId(data.payment) ??
      findCheckoutSessionId(data.session) ??
      findCheckoutSessionId(data.checkout) ??
      findCheckoutSessionId(data.stripe) ??
      null

    return {
      serviceOrderId: pick(data.serviceOrderId, data.service_order_id),
      accountId: pick(data.accountId, data.account_id),
      planId: pick(data.planId, data.plan_id),
      priceId: pick(
        data.priceId,
        pick(data.price_id, pick(data.planPricingId, data.plan_pricing_id))
      ),
      type: data.type,
      status: data.status,
      gatewayId: pick(data.gatewayId, data.gateway_id),
      startDate: pick(data.startDate, data.start_date),
      endDate: pick(data.endDate, data.end_date),
      currentPeriodStart: pick(data.currentPeriodStart, data.current_period_start),
      currentPeriodEnd: pick(data.currentPeriodEnd, data.current_period_end),
      autoRenew: pick(data.autoRenew, data.auto_renew),
      ip: data.ip,
      port: data.port,
      ipFwd: pick(data.ipFwd, data.ip_fwd),
      portFwd: pick(data.portFwd, data.port_fwd),
      timezone: data.timezone,
      metadata,
      clientSecret: clientSecret ?? null,
      checkoutSessionId: checkoutSessionId ?? null,
      lastEditor: pick(data.lastEditor, data.last_editor),
      createdAt: pick(data.createdAt, data.created_at),
      updatedAt: pick(data.updatedAt, data.updated_at)
    }
  },

  transformMeta(meta = {}) {
    return {
      count: meta.count,
      total: meta.total,
      limit: meta.limit,
      offset: meta.offset,
      requestId: pick(meta.requestId, meta.request_id)
    }
  },

  transformPayment(response = {}) {
    const payment =
      response?.payment ??
      response?.data?.payment ??
      response?.results?.payment ??
      response?.session ??
      response?.checkout ??
      null
    if (!payment) return undefined
    const clientSecret = pick(
      payment.clientSecret,
      pick(
        payment.client_secret,
        pick(payment.checkoutSessionClientSecret, payment.checkout_session_client_secret)
      )
    )
    if (!clientSecret) return undefined
    return { clientSecret }
  },

  transformListResponse(response = {}) {
    return {
      success: response.success,
      data: Array.isArray(response.results)
        ? response.results.map((item) => this.transformServiceOrder(item))
        : [],
      meta: this.transformMeta(response.meta)
    }
  },

  transformCreateResponse(response = {}) {
    const serviceOrderData = getServiceOrderData(response)

    return {
      success: response.success,
      data: serviceOrderData ? this.transformServiceOrder(serviceOrderData) : undefined,
      message: response.message,
      meta: this.transformMeta(response.meta),
      payment: this.transformPayment(response)
    }
  },

  transformUpdateResponse(response = {}) {
    const serviceOrderData = getServiceOrderData(response)

    return {
      success: response.success,
      data: serviceOrderData ? this.transformServiceOrder(serviceOrderData) : undefined,
      message: response.message,
      meta: this.transformMeta(response.meta),
      payment: this.transformPayment(response)
    }
  },

  toCreatePayload(payload = {}) {
    return {
      accountId: payload.accountId,
      planId: payload.planId,
      priceId: pick(payload.priceId, payload.planPricingId)
    }
  },

  toUpdatePayload(payload = {}) {
    return {
      accountId: payload.accountId,
      planId: payload.planId,
      priceId: pick(payload.priceId, payload.planPricingId),
      status: payload.status,
      type: payload.type,
      gatewayId: payload.gatewayId,
      startDate: payload.startDate,
      endDate: payload.endDate,
      currentPeriodStart: payload.currentPeriodStart,
      currentPeriodEnd: payload.currentPeriodEnd,
      autoRenew: payload.autoRenew,
      ip: payload.ip,
      port: payload.port,
      ipFwd: payload.ipFwd,
      portFwd: payload.portFwd,
      timezone: payload.timezone,
      metadata: payload.metadata,
      lastEditor: payload.lastEditor
    }
  },

  toUpgradePayload(payload = {}) {
    const priceId = pick(payload.priceId, payload.planPricingId)
    return {
      accountId: payload.accountId,
      newPlanId: payload.newPlanId,
      ...(priceId && { priceId })
    }
  },

  toDowngradePayload(payload = {}) {
    return {
      newPlanId: payload.newPlanId
    }
  },

  transformTransition(transition = {}) {
    if (!transition || typeof transition !== 'object') return undefined
    return {
      from: pick(transition.from, transition.fromPlan),
      to: pick(transition.to, transition.toPlan),
      effectiveAt: pick(transition.effectiveAt, transition.effective_at),
      type: transition.type
    }
  },

  transformUpgradeResponse(response = {}) {
    const data = response.data ?? response
    const currentOrder = pick(data?.currentOrder, data?.current_order)
    const newPlan = pick(data?.newPlan, data?.new_plan)
    const transition = pick(data?.transition, data?.planTransition)
    const immediate = pick(data?.immediateUpdate, pick(data?.immediate_update, data?.immediate))

    return {
      success: response.success,
      serviceOrder: currentOrder ? this.transformServiceOrder(currentOrder) : undefined,
      newPlan: newPlan ? this.transformPlan(newPlan) : undefined,
      transition: this.transformTransition(transition),
      immediate: immediate ?? true,
      payment: this.transformPayment(response),
      message: response.message,
      meta: this.transformMeta(response.meta)
    }
  },

  transformDowngradeResponse(response = {}) {
    const data = response.data ?? response
    const serviceOrderData = pick(data?.serviceOrder, data?.service_order)
    const schedule = pick(data?.schedule, data?.subscriptionSchedule)
    const newPlanId = pick(data?.newPlanId, data?.new_plan_id)

    return {
      success: response.success,
      serviceOrder: serviceOrderData ? this.transformServiceOrder(serviceOrderData) : undefined,
      schedule,
      newPlanId,
      message: response.message,
      meta: this.transformMeta(response.meta)
    }
  }
}
