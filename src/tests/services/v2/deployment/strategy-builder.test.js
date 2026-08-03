import { describe, expect, it } from 'vitest'
import {
  buildStrategy,
  mapStrategyForBuildAndActivate
} from '@/services/v2/deployment/strategy-builder'

describe('strategy-builder.buildStrategy', () => {
  it('returns undefined when no gradual, skew, nor rollout mode is set', () => {
    expect(buildStrategy({})).toBeUndefined()
    expect(
      buildStrategy({
        gradual_rollout_enabled: false,
        skew_protection_enabled: false,
        rollout_mode: ''
      })
    ).toBeUndefined()
  })

  it('builds a gradual strategy keeping candidate_from_deployment_version_id (create-version path)', () => {
    const strategy = buildStrategy({
      rollout_mode: 'GRADUAL',
      gradual_rollout_enabled: true,
      gradual_rollout_candidate_percentage: 30,
      gradual_rollout_candidate_cookie_name: 'canary',
      gradual_rollout_candidate_cookie_max_age_seconds: 600,
      gradual_rollout_candidate_from_deployment_version_id: 'dv-1'
    })

    expect(strategy.rollout_mode).toBe('GRADUAL')
    expect(strategy.gradual_rollout).toMatchObject({
      enabled: true,
      candidate_percentage: 30,
      candidate_cookie_name: 'canary',
      candidate_cookie_max_age_seconds: 600,
      candidate_from_deployment_version_id: 'dv-1'
    })
  })

  it('nulls candidate_percentage when gradual is disabled', () => {
    const strategy = buildStrategy({
      rollout_mode: 'INSTANT',
      gradual_rollout_enabled: false,
      gradual_rollout_candidate_percentage: 30
    })

    expect(strategy.gradual_rollout.candidate_percentage).toBeNull()
  })
})

describe('strategy-builder.mapStrategyForBuildAndActivate', () => {
  it('returns undefined for an undefined strategy', () => {
    expect(mapStrategyForBuildAndActivate(undefined)).toBeUndefined()
  })

  it('rewrites the candidate key to candidate_from_release_id: null and drops the legacy key (B1)', () => {
    const mapped = mapStrategyForBuildAndActivate({
      rollout_mode: 'GRADUAL',
      gradual_rollout: {
        enabled: true,
        candidate_percentage: 25,
        candidate_from_deployment_version_id: 'dv-1'
      },
      skew_protection: { enabled: false }
    })

    expect(mapped.gradual_rollout).not.toHaveProperty('candidate_from_deployment_version_id')
    expect(mapped.gradual_rollout.candidate_from_release_id).toBeNull()
    expect(mapped.gradual_rollout.candidate_percentage).toBe(25)
    expect(mapped.skew_protection).toEqual({
      enabled: false,
      cookie_name: '__azdeploy_skew',
      max_age_seconds: 3600,
      max_skewed_deployments: 10
    })
  })

  it('normalizes skew_protection with the API defaults when no gradual_rollout is present', () => {
    const mapped = mapStrategyForBuildAndActivate({
      rollout_mode: 'INSTANT',
      skew_protection: { enabled: true }
    })

    expect(mapped.rollout_mode).toBe('INSTANT')
    expect(mapped).not.toHaveProperty('gradual_rollout')
    expect(mapped.skew_protection).toEqual({
      enabled: true,
      cookie_name: '__azdeploy_skew',
      max_age_seconds: 3600,
      max_skewed_deployments: 10
    })
  })

  it('keeps skew_protection values provided by the form, defaulting only the gaps', () => {
    const mapped = mapStrategyForBuildAndActivate({
      rollout_mode: 'INSTANT',
      skew_protection: {
        enabled: true,
        cookie_name: 'custom_skew',
        max_age_seconds: null,
        max_skewed_deployments: 3
      }
    })

    expect(mapped.skew_protection).toEqual({
      enabled: true,
      cookie_name: 'custom_skew',
      max_age_seconds: 3600,
      max_skewed_deployments: 3
    })
  })
})
