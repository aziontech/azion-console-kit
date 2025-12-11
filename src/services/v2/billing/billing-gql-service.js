import { getCurrentMonthStartEnd } from '@/helpers/get-current-month-start-end'
import { BillingGqlAdapter } from './billing-gql-adapter'
import { BaseService } from '@/services/v2/base/query/baseService'

export class BillingGqlService extends BaseService {
  constructor() {
    super()
    this.adapter = BillingGqlAdapter
    this.baseURL = 'v4/billing/graphql'
  }

  async #fetchLastBill(dateCreated) {
    const dateRange = { from_date: dateCreated, to_date: getCurrentMonthStartEnd().dateFinal }

    const { data } = await this.http.request({
      method: 'POST',
      url: `${this.baseURL}`,
      body: {
        query: `
          query lastBill(
            $from_date: String!
            $to_date: String!
          ) {
            bill: billDetail(
              limit: 10000,
              filter: {
                createdDateGte: $from_date
                createdDateLt: $to_date
              },
              groupBy: [clientId, invoiceNumber, currency]
              orderBy: [createdDate_DESC]
            ) {
              totalValue
            }
          }
        `,
        variables: dateRange
      }
    })
    return data
  }

  async #fetchLastCreditAndExpirationDate() {
    const { data } = await this.http.request({
      method: 'POST',
      url: `${this.baseURL}`,
      body: {
        query: `
          query lastTrialCredit {
            lastTrialCredit: balanceFinancialEntry(
              limit: 1,
              filter: {
                entryTypeIn: [
                  "remaining_trial_credit",
                  "trial_credit"
                ]
              }
              orderBy: [created_DESC]
            ) {
              created
              amount
              clientId
              entryType
              expirationDate
            }
          }
        `
      }
    })
    return data
  }

  async fetchCreditAndExpirationDate() {
    try {
      const { data: lastCredit } = await this.#fetchLastCreditAndExpirationDate()

      const { amount, lastRecordGenerationDate, days } =
        this.adapter.transformCreditAndExpirationDate(lastCredit)
      if (!amount || !days) return {}

      const { data: lastBill } = await this.#fetchLastBill(lastRecordGenerationDate)
      const { credit, formatCredit } = this.adapter.transformMessageCreditAndExpirationDate(
        lastBill.bill,
        amount
      )

      return { credit, formatCredit, days }
    } catch (error) {
      return { credit: 0, formatCredit: '0,00', days: 0 }
    }
  }

  async getCreditAndExpirationDate() {
    return await this._ensureQueryData(
      ['billing', 'credit-expiration'],
      () => this.fetchCreditAndExpirationDate(),
      { cacheType: this.cacheType.SENSITIVE }
    )
  }
}

export const billingGqlService = new BillingGqlService()
