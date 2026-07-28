export const PAYMENT_METHOD_TYPE = Object.freeze({
  CARD: 'card',
  WALLET: 'wallet',
  PAYPAL: 'paypal',
  ACH: 'ach',
  SEPA: 'sepa',
  PIX: 'pix',
  BOLETO: 'boleto',
  WIRE: 'wire',
  BANK_TRANSFER: 'bank_transfer',
  CHECK: 'check'
})

export const PAYMENT_METHOD_STATUS = Object.freeze({
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  EXPIRED: 'expired',
  PENDING: 'pending'
})
