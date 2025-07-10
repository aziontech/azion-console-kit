import { getCurrentMonthStartEnd } from '@/helpers/get-current-month-start-end'

export class BillingGqlService {
  constructor(http, adapter) {
    this.http = http
    this.adapter = adapter
    this.baseURL = 'v4/billing/graphql'
  }

  #getLastBill = async (dateCreated) => {
    const dateRange = {
      from_date: dateCreated,
      to_date: getCurrentMonthStartEnd().dateFinal
    }

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

  #getLastCreditAndExpirationDate = async () => {
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

  getCreditAndExpirationDate = async () => {
    const { data: lastCredit } = await this.#getLastCreditAndExpirationDate()

    const { amount, lastRecordGenerationDate, days } =
      this.adapter.transformCreditAndExpirationDate(lastCredit)
    if (!amount || !days) return {}

    const { data: lastBill } = await this.#getLastBill(lastRecordGenerationDate)
    const { credit, formatCredit } = this.adapter.transformMessageCreditAndExpirationDate(lastBill.bill, amount)

    return {
      credit,
      formatCredit,
      days
    }
  }
}
