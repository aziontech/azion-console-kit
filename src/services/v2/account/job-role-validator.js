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

export const isValidJobRole = (role) => VALID_JOB_ROLES.has(role)

export const normalizeJobRole = (role) => (isValidJobRole(role) ? role : DEFAULT_JOB_ROLE)
