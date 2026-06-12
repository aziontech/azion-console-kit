import { useAccountStore } from '@/stores/account'
import { useAdditionalDataFormState } from '@/composables/useAdditionalDataFormState'
import {
  postAdditionalDataService,
  patchFullnameService,
  updateAccountInfoService
} from '@/services/signup-services'
import { queryClient } from '@/services/v2/base/query/queryClient'
import { queryKeys } from '@/services/v2/base/query/queryKeys'

const USAGE_INTENT_TO_API_VALUE = {
  learn: 'Study',
  'personal-projects': 'Personal',
  work: 'Work'
}

const COMPANY_SIZE_TO_API_VALUE = {
  'just-me': 'Just me',
  '2-100': '2 to 100 employees',
  '101-500': '101 to 500 employees',
  '501-1000': '501 to 1000 employees',
  '1001+': '1001+ employees'
}

const ADDITIONAL_DATA_INFO = [
  {
    id: 1,
    key: 'How are you planning to use Azion?',
    values: [
      { id: 1, value: 'Personal', other_values: false },
      { id: 2, value: 'Work', other_values: false },
      { id: 3, value: 'Study', other_values: false }
    ]
  },
  {
    id: 2,
    key: 'What best describes your role?',
    values: [
      { id: 4, value: 'Software Developer', other_values: false },
      { id: 5, value: 'DevOps Engineer', other_values: false },
      { id: 6, value: 'Infrastructure Analyst', other_values: false },
      { id: 7, value: 'Network Engineer', other_values: false },
      { id: 8, value: 'Security Specialist', other_values: false },
      { id: 9, value: 'Data Engineer', other_values: false },
      { id: 10, value: 'AI/ML Engineer', other_values: false },
      { id: 11, value: 'IoT Engineer', other_values: false },
      { id: 12, value: 'Team Lead', other_values: false },
      { id: 13, value: 'Other', other_values: true }
    ]
  },
  {
    id: 3,
    key: 'How big is your company?',
    values: [
      { id: 14, value: 'Just me', other_values: false },
      { id: 15, value: '2 to 100 employees', other_values: false },
      { id: 16, value: '101 to 500 employees', other_values: false },
      { id: 17, value: '501 to 1000 employees', other_values: false },
      { id: 18, value: '1001+ employees', other_values: false }
    ]
  },
  {
    id: 999,
    key: 'Your Full Name',
    values: []
  },
  {
    id: 4,
    key: 'Company Website?',
    values: [{ id: 19, value: '', other_values: true }]
  },
  {
    id: 5,
    key: 'Do you want to schedule an onboarding session with an Azion expert?',
    values: [
      { id: 20, value: 'Yes', other_values: false },
      { id: 21, value: 'No', other_values: false }
    ]
  }
]

export const persistOnboardingData = async ({ plan } = {}) => {
  const accountStore = useAccountStore()
  const { state } = useAdditionalDataFormState()
  const { usageIntent, role, companySize, companyWebsite, fullName, termsAccepted } = state.value

  const usersPayload = fullName || ''
  const [firstName = '', ...lastNameParts] = usersPayload.split(' ')
  const lastName = lastNameParts.join(' ')
  const userId = accountStore.userId

  const requests = [updateAccountInfoService(role), patchFullnameService(usersPayload)]

  if (!accountStore.accountData?.jobRole) {
    requests.push(
      postAdditionalDataService({
        payload: {
          id: userId,
          use: USAGE_INTENT_TO_API_VALUE[usageIntent],
          role,
          inputRole: undefined,
          companySize: COMPANY_SIZE_TO_API_VALUE[companySize],
          onboardingSession: termsAccepted,
          companyWebsite,
          plan,
          fullName: usersPayload
        },
        options: ADDITIONAL_DATA_INFO
      })
    )
  }

  const [updatedAccount] = await Promise.all(requests)

  queryClient.removeQueries({ queryKey: queryKeys.account.info() })

  accountStore.setAccountData({
    first_login: false,
    jobRole: updatedAccount.jobRole,
    first_name: firstName,
    last_name: lastName,
    firstName,
    lastName
  })
}
