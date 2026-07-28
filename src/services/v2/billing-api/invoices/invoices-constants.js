export const INVOICE_STATUS = Object.freeze({
  OPEN: 'open',
  PAID: 'paid',
  PARTIALLY_PAID: 'partially_paid',
  VOID: 'void',
  UNCOLLECTIBLE: 'uncollectible'
})

export const INVOICE_OPEN_STATUSES = Object.freeze([
  INVOICE_STATUS.OPEN,
  INVOICE_STATUS.PARTIALLY_PAID
])

export const INVOICE_BILLABLE_STATUSES = Object.freeze([
  INVOICE_STATUS.OPEN,
  INVOICE_STATUS.PARTIALLY_PAID,
  INVOICE_STATUS.PAID
])

export const SETTLEMENT_SOURCE = Object.freeze({
  GATEWAY: 'gateway',
  PIX: 'pix',
  BOLETO: 'boleto',
  WIRE: 'wire',
  BANK_TRANSFER: 'bank_transfer',
  ACH: 'ach',
  SEPA: 'sepa',
  CHECK: 'check',
  CREDIT: 'credit'
})

export const SETTLEMENT_STATUS = Object.freeze({
  PENDING: 'pending',
  POSTED: 'posted',
  REVERSED: 'reversed'
})
