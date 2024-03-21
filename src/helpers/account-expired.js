import { getStaticUrlsByEnvironment } from '@/helpers'

const statusToGoBilling = ['BLOCKED', 'DEFAULTING']

const checkAccountStatus = (statusClient) => {
  if (statusToGoBilling.includes(statusClient)) {
    const billingUrl = getStaticUrlsByEnvironment('billing')
    window.location.replace(billingUrl)
  }
}

export default checkAccountStatus
