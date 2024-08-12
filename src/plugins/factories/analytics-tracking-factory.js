import { Analytics } from 'analytics'
import segmentPlugin from '@analytics/segment'

/**
 * Initialize analytics module.
 * @param {string} environment
 * @returns {import('analytics').AnalyticsInstance}
 */
export function makeAnalyticsClient(segmentToken) {
  const plugins = [segmentPlugin({ writeKey: segmentToken })]

  return new Analytics({ plugins })
}
