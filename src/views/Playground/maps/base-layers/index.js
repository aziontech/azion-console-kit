import GeoJSON from 'ol/format/GeoJSON.js'
import { Style, Fill, Stroke } from 'ol/style.js'

import * as lakesLayer from './lakes'
import * as landLayer from './land'
import * as oceanLayer from './ocean'

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

export const setOceanFeature = (vector) => {
  const style = { fill: 'rgba(0,0,0,0.85)', stroke: { color: 'rgba(0,0,0,0.5)', width: 1 } }
  const oceanFeatures = setFeatureData(oceanLayer, style)

  vector.getSource().addFeatures(oceanFeatures)
}

export const setLandFeature = (vector) => {
  const style = { fill: 'rgba(0,0,0,0.3)', stroke: { color: 'rgba(0,0,0,0.1)', width: 1 } }
  const landFeatures = setFeatureData(landLayer, style)

  vector.getSource().addFeatures(landFeatures)
}

export const setLakeFeature = (vector) => {
  const style = { fill: 'rgba(0,0,0,0.85)', stroke: { color: 'rgba(0,0,0,0.5)', width: 1 } }
  const lakesFeatures = setFeatureData(lakesLayer, style)

  vector.getSource().addFeatures(lakesFeatures)
}
