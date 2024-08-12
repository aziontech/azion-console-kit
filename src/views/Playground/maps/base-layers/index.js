import GeoJSON from 'ol/format/GeoJSON.js'
import { Style, Fill, Stroke } from 'ol/style.js'

import * as lakesLayer from './lakes'
import * as landsLayer from './land'
import * as oceansLayer from './ocean'

const setFeatureData = (jsonData, style) => {
  const features = new GeoJSON().readFeatures(jsonData, {
    featureProjection: 'EPSG:3857'
  })

  features.forEach((feature) => {
    const featureStyle = new Style({
      fill: new Fill({
        color: style.fill
      }),
      stroke: new Stroke({
        color: style.stroke.color,
        width: style.stroke.width
      })
    })
    feature.setStyle(featureStyle)
  })

  return features
}

export const setOceanFeature = () => {
  const style = { fill: 'rgba(0,0,0,0.85)', stroke: { color: 'rgba(0,0,0,0)' } }
  const oceanFeatures = setFeatureData(oceansLayer, style)

  return oceanFeatures
}

export const setLandFeature = () => {
  const style = { fill: 'rgba(0,0,0,0.3)', stroke: { color: 'rgba(0,0,0,0.1)', width: 1 } }
  const landFeatures = setFeatureData(landsLayer, style)

  return landFeatures
}

export const setLakeFeature = () => {
  const style = { fill: 'rgba(0,0,0,0.85)', stroke: { color: 'rgba(0,0,0,0)' } }
  const lakesFeatures = setFeatureData(lakesLayer, style)

  return lakesFeatures
}
