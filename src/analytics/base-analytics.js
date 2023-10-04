import Analytics from 'analytics'
import segmentPlugin from '@analytics/segment'

const plugins = []

if (import.meta.env.VITE_SEGMENT_TOKEN) {
  plugins.push(
    segmentPlugin({
      writeKey: import.meta.env.VITE_SEGMENT_TOKEN
    })
  )
}

if (import.meta.env.VITE_CLARITY_TOKEN) {
  // prettier-ignore
  ;(function(c,l,a,r,i,t,y){
    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
  })(window, document, "clarity", "script", import.meta.env.VITE_CLARITY_TOKEN);
}

const baseAnalytics = new Analytics({ plugins })

export default baseAnalytics

export const IAnalytics = {
  track: () => {},
  identify: () => {},
  page: () => {},
  assignTraits: () => {},
  reset: () => {}
}
