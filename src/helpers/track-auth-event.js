import { useAccountStore } from '@/stores/account'
import { loadUserAndAccountInfo } from '@/helpers/account-data'

/**
 * Safely tracks sign-in event without blocking the main flow.
 * @param {Object} params
 * @param {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} params.tracker
 * @param {'email'|'google'|'github'|'azure'} params.method
 * @param {string} [params.email] - Optional email override
 * @returns {Promise<void>}
 */
export async function trackSignInSafely({ tracker, method, email, loadUserData = false }) {
  try {
    const accountStore = useAccountStore()

    if (loadUserData) {
      try {
        await loadUserAndAccountInfo()
      } catch (loadError) {
        // Continue without user data - still track with available info
      }
    }

    const signupTypeFlags = accountStore.getSignupTypeFlags()
    const { userId: consoleUserId, accountData, isClientAccount } = accountStore
    const accountKind = accountData?.kind

    const payload = {
      method,
      signupTypeFlags,
      email: accountData?.email || email,
      userId: consoleUserId,
      firstname: isClientAccount
        ? accountData?.first_name || accountData?.name?.split(' ')[0]
        : undefined,
      lastname: isClientAccount
        ? accountData?.last_name || accountData?.name?.split(' ').slice(1).join(' ')
        : undefined,
      company: isClientAccount ? accountData?.company_name : undefined,
      accountKind
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
