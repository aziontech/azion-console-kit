import { Analytics } from 'analytics'
import segmentPlugin from '@analytics/segment'

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

  const segmentToken = import.meta.env['VITE_SEGMENT_TOKEN']

  const plugins = [segmentPlugin({ writeKey: segmentToken })]

  return new Analytics({ plugins })
}
