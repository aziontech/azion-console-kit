import { DEFAULT_JOB_ROLE, normalizeJobRole } from './job-role-validator'

export { DEFAULT_JOB_ROLE }

const DEFAULT_ADDRESS = Object.freeze({
  postalCode: '',
  country: '',
  region: '',
  city: '',
  address: '',
  complement: ''
})

const transformAddress = (payload) => ({
  postalCode: payload.postal_code ?? '',
  country: payload.country ?? '',
  region: payload.region ?? '',
  city: payload.city ?? '',
  address: payload.address ?? '',
  complement: payload.complement ?? ''
})

export const AccountSettingsAdapter = {
  transformAccountSettings(response) {
    const payload = response?.data
    if (!payload) {
      return { jobRole: DEFAULT_JOB_ROLE, ...DEFAULT_ADDRESS }
    }

    return {
      jobRole: normalizeJobRole(payload.job_function),
      ...transformAddress(payload)
    }
  }
}
