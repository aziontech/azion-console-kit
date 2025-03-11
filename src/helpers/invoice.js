const { VITE_ENVIRONMENT } = import.meta.env

const environment = VITE_ENVIRONMENT || 'production'

const getLinkDownloadInvoice = (period) => {
  const URL =
    environment === 'production'
      ? `https://console.azion.com/v4/billing/invoices/${period}`
      : `https://stage-console.azion.com/v4/billing/invoices/${period}`
  return URL
}

export { getLinkDownloadInvoice }
