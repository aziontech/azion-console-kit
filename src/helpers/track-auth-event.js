import { useAccountStore } from '@/stores/account'

const splitFullName = (fullName) => {
  const [firstname, ...lastNameParts] = (fullName || '').trim().split(/\s+/).filter(Boolean)

  return {
    firstname,
    lastname: lastNameParts.join(' ') || undefined
  }
}

const parseUserTrackingInfo = (userTrackingInfo) => {
  if (!userTrackingInfo?.props) return null

  const { props } = userTrackingInfo
  const { firstname, lastname } = splitFullName(props.full_name)

  return {
    email: props.email,
    userId: userTrackingInfo.id,
    accountId: props.account_id,
    firstname,
    lastname,
    company: props.account_company_name,
    accountKind: props.account_type
  }
}

/**
 * Safely tracks sign-in event without blocking the main flow.
 * @param {Object} params
 * @param {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} params.tracker
 * @param {'email'|'google'|'github'|'azure'} params.method
 * @param {string} [params.email] - Optional email override
 * @param {Object} [params.userTrackingInfo] - Optional token verification tracking payload
 * @returns {Promise<void>}
 */
export async function trackSignInSafely({ tracker, method, email, userTrackingInfo }) {
  try {
    const accountStore = useAccountStore()
    const tokenTrackingData = parseUserTrackingInfo(userTrackingInfo)

    const signupTypeFlags = accountStore.getSignupTypeFlags()
    const { userId: consoleUserId, accountData, isClientAccount } = accountStore
    const accountKind = accountData?.kind
    const fallbackFirstname = isClientAccount
      ? accountData?.first_name || accountData?.name?.split(' ')[0]
      : undefined
    const fallbackLastname = isClientAccount
      ? accountData?.last_name || accountData?.name?.split(' ').slice(1).join(' ')
      : undefined
    const fallbackCompany = isClientAccount ? accountData?.company_name : undefined

    const payload = {
      method,
      signupTypeFlags,
      email: tokenTrackingData?.email || accountData?.email || email,
      userId: tokenTrackingData?.userId || consoleUserId,
      accountId: tokenTrackingData?.accountId || accountData?.id,
      firstname: tokenTrackingData?.firstname || fallbackFirstname,
      lastname: tokenTrackingData?.lastname || fallbackLastname,
      company: tokenTrackingData?.company || fallbackCompany,
      accountKind: tokenTrackingData?.accountKind || accountKind
    }

    tracker.signIn.userSignedIn(payload).track()
  } catch (error) {
    // Silently fail - tracking should not block the user flow
  }
}

/**
 * Safely tracks sign-up event without blocking the main flow.
 * @param {Object} params
 * @param {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} params.tracker
 * @param {'email'|'google'|'github'|'azure'} params.method
 * @param {Object} params.signupTypeFlags
 * @param {string} [params.firstSessionUrl]
 */
export function trackSignUpSafely({ tracker, method, signupTypeFlags, firstSessionUrl }) {
  const track = async () => {
    try {
      const accountStore = useAccountStore()

      // Only track for client accounts (not brand/reseller/etc)
      if (!accountStore.isClientAccount) {
        return
      }

      const { userId: consoleUserId, accountData } = accountStore
      const userEmail = accountData?.email
      const userName = accountData?.name || ''
      const companyName = accountData?.company_name || ''
      const nameParts = userName.split(' ')
      const firstname = nameParts[0] || ''
      const lastname = nameParts.slice(1).join(' ') || ''

      const payload = {
        method,
        firstSessionUrl,
        signupTypeFlags,
        email: userEmail,
        userId: consoleUserId,
        accountId: accountData?.id,
        firstname,
        lastname,
        company: companyName,
        githubHandle: method === 'github' ? accountData?.github_handle : undefined
      }

      tracker.signUp.userSignedUp(payload).track()

      if (method !== 'email') {
        tracker.signUp.userAuthorizedSso(payload).track()
      }
    } catch (error) {
      // Silently fail - tracking should not block the user flow
    }
  }

  track()
}
