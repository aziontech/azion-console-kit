import { describe, expect, it } from 'vitest'
import {
  DEFAULT_JOB_ROLE,
  isValidJobRole,
  normalizeJobRole
} from '@/services/v2/account/job-role-validator'

describe('job-role-validator', () => {
  describe('isValidJobRole', () => {
    it.each([
      'software-developer',
      'devops-engineer',
      'infrastructure-analyst',
      'network-engineer',
      'security-specialist',
      'data-engineer',
      'ai-ml-engineer',
      'iot-engineer',
      'team-lead',
      'other'
    ])('accepts the known role "%s"', (role) => {
      expect(isValidJobRole(role)).toBe(true)
    })

    it.each([undefined, null, '', 'CEO', 'devops engineer', 'software_developer'])(
      'rejects unknown value %p',
      (value) => {
        expect(isValidJobRole(value)).toBe(false)
      }
    )
  })

  describe('normalizeJobRole', () => {
    it('returns the input when it is a valid role', () => {
      expect(normalizeJobRole('devops-engineer')).toBe('devops-engineer')
    })

    it('falls back to DEFAULT_JOB_ROLE for unknown roles', () => {
      expect(normalizeJobRole('CEO')).toBe(DEFAULT_JOB_ROLE)
    })

    it('falls back to DEFAULT_JOB_ROLE for null/undefined', () => {
      expect(normalizeJobRole(undefined)).toBe(DEFAULT_JOB_ROLE)
      expect(normalizeJobRole(null)).toBe(DEFAULT_JOB_ROLE)
    })

    it('exposes the default as "other"', () => {
      expect(DEFAULT_JOB_ROLE).toBe('other')
    })
  })
})
