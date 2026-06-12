import { useAccountStore } from '@/stores/account'

const splitFullName = (fullName) => {
  const [firstname, ...lastNameParts] = (fullName || '').trim().split(/\s+/).filter(Boolean)

  return {
    firstname,
    lastname: lastNameParts.join(' ') || undefined
  }
}

const adaptIdentityFromToken = ({ id, props } = {}) => {
  if (!props) return {}

  const { firstname, lastname } = splitFullName(props.full_name)

  return {
    email: props.email,
    userId: id,
    accountId: props.account_id,
    firstname,
    lastname,
    company: props.account_company_name,
    accountKind: props.account_type
  }
}

const adaptIdentityFromStore = (accountStore) => {
  const { userId, accountData, isClientAccount } = accountStore
  const { firstname, lastname } = splitFullName(accountData?.name)

  return {
    email: accountData?.email,
    userId,
    accountId: accountData?.id,
    firstname: isClientAccount ? accountData?.first_name || firstname : undefined,
    lastname: isClientAccount ? accountData?.last_name || lastname : undefined,
    company: isClientAccount ? accountData?.company_name : undefined,
    accountKind: accountData?.kind
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
    const signupTypeFlags = accountStore.getSignupTypeFlags()

    const identity = userTrackingInfo
      ? adaptIdentityFromToken(userTrackingInfo)
      : adaptIdentityFromStore(accountStore)

    const payload = {
      method,
      signupTypeFlags,
      email: identity.email || email,
      userId: identity.userId,
      accountId: identity.accountId,
      firstname: identity.firstname,
      lastname: identity.lastname,
      company: identity.company,
      accountKind: identity.accountKind
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
