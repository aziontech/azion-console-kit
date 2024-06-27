import { Analytics } from 'analytics'
import segmentPlugin from '@analytics/segment'
const environment = {
  development: {
    segmentToken: 'EeKBQaSXEBAkaOYc0Z9XrPALzdt5rLpI'
  },
  stage: {
    segmentToken: 'EeKBQaSXEBAkaOYc0Z9XrPALzdt5rLpI'
  },
  production: {
    segmentToken: 'ETgfGs4YWT2MBa1uMCaB6l0tsFjjvd9l'
  }
}

function getSegmentToken(env) {
  return environment[env].segmentToken
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
