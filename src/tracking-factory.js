import { Tracking, TrackClickDirective } from './tracking'
import { AZION_ANALYTICS } from './analytics'

const tracking = new Tracking(AZION_ANALYTICS)
const trackClickDirective = TrackClickDirective(tracking)

export { tracking, trackClickDirective }
