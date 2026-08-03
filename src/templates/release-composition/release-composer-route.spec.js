import { describe, expect, it } from 'vitest'
import {
  RELEASE_COMPOSER_ROUTE,
  releaseComposerRouteFromDeployment,
  releaseComposerRouteFromWorkload,
  releaseComposerRouteFirstRelease
} from '@/templates/release-composition/release-composer-route'

describe('releaseComposerRouteFromDeployment', () => {
  it('opens the global entry when no deployment id is supplied', () => {
    expect(releaseComposerRouteFromDeployment()).toEqual({ name: RELEASE_COMPOSER_ROUTE })
    expect(releaseComposerRouteFromDeployment('')).toEqual({ name: RELEASE_COMPOSER_ROUTE })
  })

  it('carries a single deployment id in the query', () => {
    expect(releaseComposerRouteFromDeployment('ds-1')).toEqual({
      name: RELEASE_COMPOSER_ROUTE,
      query: { deploymentIds: 'ds-1' }
    })
  })
})

describe('releaseComposerRouteFromWorkload', () => {
  it('opens the global entry when the workload has no bound deployment settings', () => {
    expect(releaseComposerRouteFromWorkload()).toEqual({ name: RELEASE_COMPOSER_ROUTE })
    expect(releaseComposerRouteFromWorkload({ deploymentIds: [] })).toEqual({
      name: RELEASE_COMPOSER_ROUTE
    })
  })

  it('falls back to the single-DS Scenario A route when only one DS is bound', () => {
    expect(releaseComposerRouteFromWorkload({ deploymentIds: ['ds-1'] })).toEqual({
      name: RELEASE_COMPOSER_ROUTE,
      query: { deploymentIds: 'ds-1' }
    })
  })

  it('carries every bound DS plus pickTarget when more than one is bound', () => {
    expect(releaseComposerRouteFromWorkload({ deploymentIds: ['ds-prod', 'ds-stage'] })).toEqual({
      name: RELEASE_COMPOSER_ROUTE,
      query: { deploymentIds: 'ds-prod,ds-stage', pickTarget: 'true' }
    })
  })

  it('stringifies numeric ids into the CSV query', () => {
    expect(releaseComposerRouteFromWorkload({ deploymentIds: [1, 2] })).toEqual({
      name: RELEASE_COMPOSER_ROUTE,
      query: { deploymentIds: '1,2', pickTarget: 'true' }
    })
  })

  it('drops null/empty ids before deciding the entry shape', () => {
    expect(releaseComposerRouteFromWorkload({ deploymentIds: ['ds-1', null, ''] })).toEqual({
      name: RELEASE_COMPOSER_ROUTE,
      query: { deploymentIds: 'ds-1' }
    })
  })
})

describe('releaseComposerRouteFirstRelease', () => {
  it('opens the global entry when no deployment id is supplied', () => {
    expect(releaseComposerRouteFirstRelease()).toEqual({ name: RELEASE_COMPOSER_ROUTE })
    expect(releaseComposerRouteFirstRelease({ deploymentId: '' })).toEqual({
      name: RELEASE_COMPOSER_ROUTE
    })
  })

  it('carries the DS plus the scoped resource + version as a seed when fully formed', () => {
    expect(
      releaseComposerRouteFirstRelease({
        deploymentId: 'ds-1',
        scopedType: 'firewall',
        resourceId: 'fw-7',
        versionId: 'v-42'
      })
    ).toEqual({
      name: RELEASE_COMPOSER_ROUTE,
      query: {
        deploymentIds: 'ds-1',
        seedType: 'firewall',
        seedResourceId: 'fw-7',
        seedVersionId: 'v-42'
      }
    })
  })

  it('stringifies numeric seed ids', () => {
    expect(
      releaseComposerRouteFirstRelease({
        deploymentId: 5,
        scopedType: 'application',
        resourceId: 42,
        versionId: 7
      })
    ).toEqual({
      name: RELEASE_COMPOSER_ROUTE,
      query: {
        deploymentIds: '5',
        seedType: 'application',
        seedResourceId: '42',
        seedVersionId: '7'
      }
    })
  })

  it('falls back to a plain DS-first entry when the version is missing', () => {
    expect(
      releaseComposerRouteFirstRelease({
        deploymentId: 'ds-1',
        scopedType: 'firewall',
        resourceId: 'fw-7'
      })
    ).toEqual({ name: RELEASE_COMPOSER_ROUTE, query: { deploymentIds: 'ds-1' } })
  })

  it('falls back to a plain DS-first entry when the resource id is missing', () => {
    expect(
      releaseComposerRouteFirstRelease({
        deploymentId: 'ds-1',
        scopedType: 'firewall',
        versionId: 'v-42'
      })
    ).toEqual({ name: RELEASE_COMPOSER_ROUTE, query: { deploymentIds: 'ds-1' } })
  })

  it('falls back to a plain DS-first entry for an unsupported scoped type', () => {
    expect(
      releaseComposerRouteFirstRelease({
        deploymentId: 'ds-1',
        scopedType: 'function',
        resourceId: 'fn-1',
        versionId: 'v-1'
      })
    ).toEqual({ name: RELEASE_COMPOSER_ROUTE, query: { deploymentIds: 'ds-1' } })
  })
})
