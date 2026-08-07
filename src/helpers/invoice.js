import { isProduction } from './get-environment'

const getLinkDownloadInvoice = (period) => {
  const URL = isProduction()
    ? `https://console.azion.com/billing/invoices/${period}`
    : `https://stage-console.azion.com/billing/invoices/${period}`
  return URL
}

export { getLinkDownloadInvoice }
