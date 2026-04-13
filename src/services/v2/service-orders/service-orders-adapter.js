const pick = (value, fallback) => (value !== undefined ? value : fallback)

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
      sku: item.sku,
      description: item.description,
      type: item.type,
      status: item.status,
      eolDate: item.eol_date,
      trialCreditValue: item.trial_credit_value,
      trialCreditDurationDays: item.trial_credit_duration_days,
      trialCreditCurrency: item.trial_credit_currency,
      supportsReservedCapacity: item.supports_reserved_capacity,
      supportsSavingsPlan: item.supports_savings_plan,
      isInternal: item.is_internal,
      sortOrder: item.sort_order,
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
    if (!Array.isArray(data)) return []
    return data.map((item) => this.transformPlan(item))
  },

  transformDiscountPreview(discount = {}) {
    return {
      type: discount.type,
      value: discount.value,
      currency: discount.currency
    }
  },

  transformModificationsPreview(modifications = {}) {
    return {
      applyTo: modifications.apply_to,
      applyNMonths: modifications.apply_n_months
    }
  },

  transformCouponValidation(data = {}) {
    return {
      valid: data.valid,
      code: data.code,
      planId: data.plan_id,
      couponId: data.coupon_id,
      discountPreview: data.discount_preview
        ? this.transformDiscountPreview(data.discount_preview)
        : null,
      modificationsPreview: data.modifications_preview
        ? this.transformModificationsPreview(data.modifications_preview)
        : null,
      reasons: data.reasons ?? []
    }
  },

  transformServiceOrder(data = {}) {
    return {
      serviceOrderId: pick(data.serviceOrderId, data.service_order_id),
      accountId: pick(data.accountId, data.account_id),
      planId: pick(data.planId, data.plan_id),
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
      metadata: data.metadata,
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

  transformListResponse(response = {}) {
    return {
      success: response.success,
      data: Array.isArray(response.data)
        ? response.data.map((item) => this.transformServiceOrder(item))
        : [],
      meta: this.transformMeta(response.meta)
    }
  },

  transformCreateResponse(response = {}) {
    return {
      success: response.success,
      data: this.transformServiceOrder(response.data),
      message: response.message,
      meta: this.transformMeta(response.meta),
      payment: response.payment
        ? {
            clientSecret: pick(response.payment.clientSecret, response.payment.client_secret)
          }
        : undefined
    }
  },

  transformUpdateResponse(response = {}) {
    return {
      success: response.success,
      data: this.transformServiceOrder(response.data),
      message: response.message,
      meta: this.transformMeta(response.meta)
    }
  },

  toCreatePayload(payload = {}) {
    return {
      accountId: payload.accountId,
      planId: payload.planId,
      planPricingId: payload.planPricingId
    }
  },

  toUpdatePayload(payload = {}) {
    return {
      accountId: payload.accountId,
      planId: payload.planId,
      planPricingId: payload.planPricingId,
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
  }
}
