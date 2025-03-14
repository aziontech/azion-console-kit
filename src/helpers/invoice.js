const { VITE_ENVIRONMENT } = import.meta.env

const getLinkDownloadInvoice = (period) => {
  const URL = VITE_ENVIRONMENT === 'production'
    ? `https://console.azion.com/v4/billing/invoices/${period}`
    : `https://stage-console.azion.com/v4/billing/invoices/${period}`
  return URL
}

export { getLinkDownloadInvoice }
