import { Analytics } from 'analytics'
import segmentPlugin from '@analytics/segment'
const environment = {
  development: 'STAGE_SEGMENT_TOKEN',
  stage: 'STAGE_SEGMENT_TOKEN',
  production: 'PROD_SEGMENT_TOKEN'
}

function getSegmentToken(env) {
  return environment[env]
}

/**
 * Initialize analytics module.
 * @param {string} environment
 * @returns {import('analytics').AnalyticsInstance}
 */
export function makeAnalyticsClient(environment) {
  if (!environment) {
    throw Error('Provide an environment to select correct tracking token')
  }
  const isInvalidEnvironment = !['development', 'stage', 'production'].includes(environment)
  if (isInvalidEnvironment) {
    throw Error('Provide an valid environment to select correct tracking token')
  }

  const segmentToken = getSegmentToken(environment)

  const plugins = [segmentPlugin({ writeKey: segmentToken })]

  return new Analytics({ plugins })
}
