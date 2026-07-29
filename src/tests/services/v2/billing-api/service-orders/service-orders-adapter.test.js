import { describe, expect, it } from 'vitest'
import { ServiceOrdersAdapter } from '@/services/v2/billing-api/service-orders/service-orders-adapter'

const RAW_SO = {
  id: 77,
  subscription_id: '019c9fa2-ee78-7a7a-a266-796f750d8261',
  customer_agreement_id: 11,
  order_number: 'SO-2026-001',
  type: 'support',
  status: 'active',
  period: 'annual',
  billing_mode: 'postpaid',
  commercial_items: [{ product_id: 5, plan_id: 9, quantity: 2, metric: 'gb', discount_pct: 10 }],
  commercial_terms: {
    po_number: 'PO-1',
    net_terms_days: 30,
    auto_renewal: true,
    start_date: '2026-08-01',
    end_date: '2027-07-31'
  },
  terms_conditions_id: 3,
  terms_conditions_execution_id: 4,
  order_form_execution_id: 5,
  required_document_version_ids: [1, 2],
  price_table_ref: { id: 'pt-1', version: 3 },
  created_at: '2026-07-29T10:00:00Z',
  last_modified: '2026-07-29T11:00:00Z',
  last_editor: 'herbert'
}

describe('ServiceOrdersAdapter transforms', () => {
  it('maps the service order to camelCase preserving the commercial payload', () => {
    const result = ServiceOrdersAdapter.transformServiceOrder(RAW_SO)

    expect(result.id).toBe(77)
    expect(result.subscriptionId).toBe('019c9fa2-ee78-7a7a-a266-796f750d8261')
    expect(result.orderNumber).toBe('SO-2026-001')
    expect(result.billingMode).toBe('postpaid')
    expect(result.commercialItems[0]).toEqual({
      productId: 5,
      planId: 9,
      quantity: 2,
      metric: 'gb',
      discountPct: 10
    })
    expect(result.commercialTerms.netTermsDays).toBe(30)
    expect(result.priceTableRef).toEqual({ id: 'pt-1', version: 3 })
    expect(result.requiredDocumentVersionIds).toEqual([1, 2])
    expect(result.audit.lastEditor).toBe('herbert')
  })

  it('defaults collections and nullable blocks when absent', () => {
    const result = ServiceOrdersAdapter.transformServiceOrder({ id: 1, status: 'draft' })

    expect(result.commercialItems).toEqual([])
    expect(result.requiredDocumentVersionIds).toEqual([])
    expect(result.commercialTerms).toBeNull()
    expect(result.priceTableRef).toBeNull()
  })

  it('maps an order action', () => {
    const result = ServiceOrdersAdapter.transformOrderAction({
      id: 9,
      service_order_id: 77,
      action_type: 'commitment_change',
      status: 'completed',
      effective_at: '2026-08-01',
      operation_key: 'op-1'
    })

    expect(result.actionType).toBe('commitment_change')
    expect(result.serviceOrderId).toBe(77)
    expect(result.operationKey).toBe('op-1')
  })

  it('maps the terms envelope with documents and executions', () => {
    const result = ServiceOrdersAdapter.transformTermsResponse({
      state: 'executed',
      data: {
        terms_conditions_id: 3,
        type: 'support',
        scope: 'service_order',
        status: 'active',
        documents: [{ id: 1, type: 'sla', public_url: 'https://x/sla', version: '2' }],
        executions: [{ id: 8, target_type: 'terms_conditions', method: 'clickwrap' }]
      }
    })

    expect(result.state).toBe('executed')
    expect(result.data.documents[0].publicUrl).toBe('https://x/sla')
    expect(result.data.executions[0].method).toBe('clickwrap')
  })

  it('maps list and detail envelopes', () => {
    const list = ServiceOrdersAdapter.transformListResponse({
      count: 1,
      total_pages: 1,
      page: 1,
      page_size: 20,
      results: [RAW_SO]
    })
    expect(list.count).toBe(1)
    expect(list.results[0].id).toBe(77)

    const detail = ServiceOrdersAdapter.transformDetailResponse({ state: 'executed', data: RAW_SO })
    expect(detail.state).toBe('executed')
    expect(detail.data.id).toBe(77)

    expect(ServiceOrdersAdapter.transformDetailResponse({}).data).toBeNull()
  })
})

describe('ServiceOrdersAdapter builders', () => {
  it('builds list params only with the contract filters', () => {
    expect(
      ServiceOrdersAdapter.toListParams({
        page: 2,
        pageSize: 50,
        fields: 'id,status',
        account: 900,
        billingAccount: 12,
        status: 'active',
        subscription: 'nope',
        type: 'support'
      })
    ).toEqual({
      page: 2,
      page_size: 50,
      fields: 'id,status',
      account: 900,
      billing_account: 12,
      status: 'active'
    })
  })

  it('builds the create payload with the required fields', () => {
    expect(
      ServiceOrdersAdapter.toCreatePayload({
        period: 'monthly',
        commercialItems: [{ productId: 5 }],
        accountId: 900,
        billingMode: 'prepaid',
        tosVersion: '2026-07-01'
      })
    ).toEqual({
      period: 'monthly',
      commercial_items: [{ product_id: 5 }],
      account_id: 900,
      billing_mode: 'prepaid',
      tos_acceptance: { version: '2026-07-01' }
    })
  })

  it('keeps commercial_items as an array even when absent', () => {
    expect(ServiceOrdersAdapter.toCreatePayload({ period: 'annual' })).toEqual({
      period: 'annual',
      commercial_items: []
    })
  })

  it('restricts the update payload to order_number', () => {
    expect(
      ServiceOrdersAdapter.toUpdatePayload({
        orderNumber: 'SO-1',
        type: 'support',
        status: 'active',
        commercialItems: [{ productId: 1 }]
      })
    ).toEqual({ order_number: 'SO-1' })
  })

  it('builds the action payload with action_type required', () => {
    expect(
      ServiceOrdersAdapter.toActionPayload({
        actionType: 'change',
        effectiveAt: '2026-08-01',
        reason: 'amendment',
        signedDocRef: 'doc-1',
        change: { discount_pct: 5 }
      })
    ).toEqual({
      action_type: 'change',
      effective_at: '2026-08-01',
      reason: 'amendment',
      signed_doc_ref: 'doc-1',
      change: { discount_pct: 5 }
    })
  })

  it('builds the cancel payload carrying only the reason', () => {
    expect(ServiceOrdersAdapter.toCancelPayload({ reason: 'x', when: 'now' })).toEqual({
      reason: 'x'
    })
    expect(ServiceOrdersAdapter.toCancelPayload({})).toEqual({})
    expect(ServiceOrdersAdapter.toCancelPayload({ reason: null })).toEqual({})
  })
})
