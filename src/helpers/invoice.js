const { VITE_ENVIRONMENT } = import.meta.env

const getLinkDownloadInvoice = (period) => {
  const URL =
    VITE_ENVIRONMENT === 'production'
      ? `https://console.azion.com/billing/invoices/${period}`
      : `https://stage-console.azion.com/billing/invoices/${period}`
  return URL
}

export { getLinkDownloadInvoice }
