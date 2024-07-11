import { getEnvironment, getStaticUrlsByEnvironment } from '@/helpers'

const statusToGoBilling = ['BLOCKED', 'DEFAULTING']

const checkAccountStatus = (statusClient) => {
  if (statusToGoBilling.includes(statusClient)) {
    const environment = getEnvironment()
    const isProduction = environment === 'production'
    const billingUrl = getStaticUrlsByEnvironment('billing')
    const drawerPath = isProduction ? '' : '/payment?paymentSession=true'

    window.location.replace(`${billingUrl}${drawerPath}`)
  }
}

export default checkAccountStatus
