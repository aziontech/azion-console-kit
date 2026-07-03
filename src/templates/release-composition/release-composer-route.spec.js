import { describe, expect, it } from 'vitest'
import {
  RELEASE_COMPOSER_ROUTE,
  releaseComposerRouteFromDeployment,
  releaseComposerRouteFromWorkload
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
