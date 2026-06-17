export const DEFAULT_JOB_ROLE = 'other'

const VALID_JOB_ROLES = new Set([
  'software-developer',
  'devops-engineer',
  'infrastructure-analyst',
  'network-engineer',
  'security-specialist',
  'data-engineer',
  'ai-ml-engineer',
  'iot-engineer',
  'team-lead',
  DEFAULT_JOB_ROLE
])

const DEFAULT_ADDRESS = Object.freeze({
  postalCode: '',
  country: '',
  region: '',
  city: '',
  address: '',
  complement: ''
})

const normalizeJobRole = (rawJobRole) =>
  VALID_JOB_ROLES.has(rawJobRole) ? rawJobRole : DEFAULT_JOB_ROLE

const transformAddress = (payload) => ({
  postalCode: payload.postal_code || '',
  country: payload.country || '',
  region: payload.region || '',
  city: payload.city || '',
  address: payload.address || '',
  complement: payload.complement || ''
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
