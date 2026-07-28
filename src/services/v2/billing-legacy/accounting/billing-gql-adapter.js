import { getRemainingDays, formatUnitValue } from '@/helpers'

export const BillingGqlAdapter = {
  transformCreditAndExpirationDate(data) {
    try {
      const [lastTrialCredit] = data.lastTrialCredit
      const { amount = 0, expirationDate, created = null } = lastTrialCredit

      return {
        amount,
        lastRecordGenerationDate: created,
        days: getRemainingDays(expirationDate)
      }
    } catch (error) {
      return {
        amount: 0,
        lastRecordGenerationDate: null,
        days: 0
      }
    }
  },
  transformMessageCreditAndExpirationDate(lastBill, amount) {
    try {
      const totalAmount = lastBill.reduce((total, { totalValue }) => {
        return total + (parseFloat(totalValue) || 0)
      }, 0)

      const value = amount - totalAmount
      const credit = value > 0 ? value : 0
      return { credit, formatCredit: formatUnitValue(credit) }
    } catch (error) {
      return {}
    }
  }
}
