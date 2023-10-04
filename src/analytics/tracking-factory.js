import { Tracking, TrackClickDirective } from './tracking'
import baseAnalytics from './base-analytics'
import { AzionAnalytics } from './azion-analytics'

const azionAnalytics = new AzionAnalytics(baseAnalytics)
const tracking = new Tracking(azionAnalytics)
const trackClickDirective = TrackClickDirective(tracking)

export { tracking, trackClickDirective }
