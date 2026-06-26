import { describe, it, expect } from 'vitest'
import {
  v6WorkloadsList,
  legacyWorkloadsList,
  environmentsList,
  envNameById,
  makeWorkload,
  makeBinding,
  asListResponse
} from './harness'

// Guaranteed binding fields the reverse-lookup is allowed to read (design §3.2).
const ALLOWED_BINDING_KEYS = ['deployment_id', 'environment_id', 'domains']

describe('release-impact harness — fixtures', () => {
  it('exposes a v6 workloads list in the { body, count } query shape', () => {
    expect(v6WorkloadsList).toHaveProperty('body')
    expect(v6WorkloadsList.count).toBe(v6WorkloadsList.body.length)
    expect(v6WorkloadsList.body.length).toBeGreaterThan(0)
  })

  it('v6 workloads carry active.content and bindings with only the three guaranteed fields', () => {
    for (const workload of v6WorkloadsList.body) {
      expect(['Active', 'Inactive']).toContain(workload.active.content)
      expect(Array.isArray(workload.bindings)).toBe(true)

      for (const binding of workload.bindings) {
        expect(Object.keys(binding).sort()).toEqual([...ALLOWED_BINDING_KEYS].sort())
        expect(Array.isArray(binding.domains)).toBe(true)
      }
    }
  })

  it('includes the edge cases the reverse-lookup must handle', () => {
    const bindings = v6WorkloadsList.body.flatMap((workload) => workload.bindings)

    // an inactive workload exists (active-only filtering target)
    expect(v6WorkloadsList.body.some((workload) => workload.active.content === 'Inactive')).toBe(
      true
    )
    // a binding with null deployment_id exists (must be skipped)
    expect(bindings.some((binding) => binding.deployment_id === null)).toBe(true)
    // an environment_id absent from the env map exists (name must stay null)
    expect(bindings.some((binding) => !envNameById.has(binding.environment_id))).toBe(true)
  })

  it('exposes a legacy tenant with no bindings', () => {
    expect(legacyWorkloadsList.body.length).toBeGreaterThan(0)
    expect(legacyWorkloadsList.body.every((workload) => workload.bindings.length === 0)).toBe(true)
  })

  it('exposes an environments list of { id, name } and a matching name map', () => {
    expect(environmentsList.count).toBe(environmentsList.body.length)
    for (const env of environmentsList.body) {
      expect(env).toHaveProperty('id')
      expect(env).toHaveProperty('name')
    }
    expect(envNameById.get('env-prod')).toBe('Production')
    expect(envNameById.has('env-orphan')).toBe(false)
  })

  it('provides factory helpers for building bespoke cases', () => {
    const workload = makeWorkload({
      id: 'x',
      activeContent: 'Inactive',
      bindings: [
        makeBinding({
          deployment_id: 'ds-9',
          environment_id: 'env-prod',
          domains: ['a.example.com']
        })
      ]
    })
    expect(workload.active.content).toBe('Inactive')
    expect(workload.bindings[0].domains).toEqual(['a.example.com'])
    expect(asListResponse([workload])).toEqual({ body: [workload], count: 1 })
  })
})
