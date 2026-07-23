/**
 * Billing GraphQL contract (critical areas — money).
 * Source: src/services/v2/billing/{billing-gql-service,billing-gql-adapter}.js
 * The service double-unwraps: httpService strips the axios envelope, then the
 * GQL body itself is `{ data: { <alias>: [...] } }` — the schemas below model
 * the GQL BODY (what the http seam answers).
 *   READ lastTrialCredit: created, amount, expirationDate (drives credit/days)
 *   READ bill: totalValue (string decimal summed by the adapter)
 *   WRITE: every request is a POST { query, variables? }
 */
import * as yup from 'yup'

export const lastTrialCreditResponse = yup.object({
  data: yup
    .object({
      lastTrialCredit: yup
        .array()
        .of(
          yup.object({
            created: yup.string().required(),
            amount: yup.number().required(),
            clientId: yup.string(),
            entryType: yup.string(),
            expirationDate: yup.string().required()
          })
        )
        .required()
    })
    .required()
})

export const lastBillResponse = yup.object({
  data: yup
    .object({
      bill: yup
        .array()
        .of(
          yup.object({
            totalValue: yup
              .mixed()
              .required()
              .test('parseable', 'totalValue must parse as a number', (value) =>
                Number.isFinite(parseFloat(value))
              )
          })
        )
        .required()
    })
    .required()
})

export const gqlRequest = yup.object({
  query: yup.string().required(),
  variables: yup.object().notRequired().default(undefined)
})
