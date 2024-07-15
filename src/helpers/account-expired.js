import { getEnvironment, getStaticUrlsByEnvironment } from '@/helpers'

const statusToGoBilling = ['BLOCKED', 'DEFAULTING']

const checkAccountStatus = (statusClient) => {
  if (statusToGoBilling.includes(statusClient)) {
    const environment = getEnvironment()
    const isDevelopment = environment === 'development'

    const billingUrl = getStaticUrlsByEnvironment('billing')
    const drawerPath = isDevelopment ? '/payment?paymentSession=true' : ''

    window.location.replace(`${billingUrl}${drawerPath}`)
  }
}

export default checkAccountStatus
