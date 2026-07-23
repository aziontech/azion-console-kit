/**
 * Payment contract (critical areas — money).
 * Source: src/services/v2/payment/{payment-service,payment-adapter}.js
 *   READ  (transformListCreditCards): id, card_holder, card_brand,
 *         card_last_4_digits, card_expiration_month/year, is_default
 *   WRITE (createCreditCard, built in add-payment-method-block from the
 *         Stripe token): snake_case card fields + stripe_token
 *   WRITE (addCredit): { amount }
 */
import * as yup from 'yup'

const creditCard = yup.object({
  id: yup.number().required(),
  card_holder: yup.string().required(),
  card_brand: yup.string().required(),
  card_last_4_digits: yup.string().required(),
  card_expiration_month: yup.number().required(),
  card_expiration_year: yup.number().required(),
  is_default: yup.boolean().required()
})

export const creditCardsListResponse = yup.object({
  count: yup.number().required(),
  results: yup.array().of(creditCard).required()
})

export const creditCardCreateRequest = yup
  .object({
    card_address_zip: yup.string().required(),
    card_country: yup.string().required(),
    stripe_token: yup.string().required(),
    card_id: yup.string().required(),
    card_brand: yup.string().required(),
    card_holder: yup.string().required(),
    card_last_4_digits: yup.string().required(),
    card_expiration_month: yup.number().required(),
    card_expiration_year: yup.number().required()
  })
  .noUnknown()

export const addCreditRequest = yup
  .object({
    amount: yup.number().required().positive()
  })
  .noUnknown()
