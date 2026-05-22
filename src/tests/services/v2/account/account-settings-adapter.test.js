import { describe, expect, it } from 'vitest'
import {
  AccountSettingsAdapter,
  DEFAULT_JOB_ROLE
} from '@/services/v2/account/account-settings-adapter'

describe('AccountSettingsAdapter.transformAccountSettings', () => {
  it('returns full defaults when payload data is missing', () => {
    expect(AccountSettingsAdapter.transformAccountSettings(undefined)).toEqual({
      jobRole: DEFAULT_JOB_ROLE,
      postalCode: '',
      country: '',
      region: '',
      city: '',
      address: '',
      complement: ''
    })

    expect(AccountSettingsAdapter.transformAccountSettings({ data: null })).toEqual({
      jobRole: DEFAULT_JOB_ROLE,
      postalCode: '',
      country: '',
      region: '',
      city: '',
      address: '',
      complement: ''
    })
  })

  it('extracts every field from a full payload', () => {
    const result = AccountSettingsAdapter.transformAccountSettings({
      data: {
        job_function: 'devops-engineer',
        postal_code: '01234-567',
        country: 'BR',
        region: 'SP',
        city: 'São Paulo',
        address: 'Av. Paulista 1000',
        complement: 'Apt 42'
      }
    })

    expect(result).toEqual({
      jobRole: 'devops-engineer',
      postalCode: '01234-567',
      country: 'BR',
      region: 'SP',
      city: 'São Paulo',
      address: 'Av. Paulista 1000',
      complement: 'Apt 42'
    })
  })

  it('falls back to "other" for unknown job roles', () => {
    const result = AccountSettingsAdapter.transformAccountSettings({
      data: { job_function: 'unknown-role' }
    })
    expect(result.jobRole).toBe(DEFAULT_JOB_ROLE)
  })

  it('preserves canonical job roles', () => {
    const canonicalRoles = [
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
    ]
    canonicalRoles.forEach((role) => {
      const result = AccountSettingsAdapter.transformAccountSettings({
        data: { job_function: role }
      })
      expect(result.jobRole).toBe(role)
    })
  })

  it('returns empty strings for missing address fields', () => {
    const result = AccountSettingsAdapter.transformAccountSettings({
      data: { job_function: 'team-lead' }
    })
    expect(result).toEqual({
      jobRole: 'team-lead',
      postalCode: '',
      country: '',
      region: '',
      city: '',
      address: '',
      complement: ''
    })
  })
})
