import GeoJSON from 'ol/format/GeoJSON.js'
import { Style, Fill, Stroke } from 'ol/style.js'
import { useAccountStore } from '@/stores/account'
import { storeToRefs } from 'pinia'

import * as lakesLayer from './lakes'
import * as landsLayer from './land'
import * as oceansLayer from './ocean'

const getCurrentTheme = () => {
  const accountStore = useAccountStore()
  const { currentTheme } = storeToRefs(accountStore)

  if (currentTheme.value === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  return currentTheme.value
}
const setFeatureData = (jsonData) => {
  const currentTheme = getCurrentTheme()

  const features = new GeoJSON().readFeatures(jsonData, {
    featureProjection: 'EPSG:3857'
  })

  features.forEach((feature) => {
    setFeatureStyle(feature, currentTheme)
  })

  return features
}

export const setFeatureStyle = (feature) => {
  if (!feature.get('style')) {
    return
  }

  const currentTheme = getCurrentTheme()

  const featureStyle = new Style({
    fill: new Fill({
      ...feature.get('style')[currentTheme]?.fill
    }),
    stroke: new Stroke({
      ...feature.get('style')[currentTheme]?.stroke
    })
  })

  feature.setStyle(featureStyle)
}

export const setOceanFeature = () => {
  const oceanFeatures = setFeatureData(oceansLayer)

  return oceanFeatures
}

export const setLandFeature = () => {
  const landFeatures = setFeatureData(landsLayer)

  return landFeatures
}

export const setLakeFeature = () => {
  const lakesFeatures = setFeatureData(lakesLayer)

  return lakesFeatures
}
