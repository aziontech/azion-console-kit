import GeoJSON from 'ol/format/GeoJSON.js'
import { Style, Fill, Stroke, RegularShape as Square } from 'ol/style.js'

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
  const features = new GeoJSON().readFeatures(jsonData, {
    featureProjection: 'EPSG:3857'
  })

  features.forEach((feature) => {
    setFeatureStyle(feature)
  })

  return features
}

export const setFeatureStyle = (feature) => {
  const currentTheme = getCurrentTheme()

  if (
    !feature.get('style')?.[currentTheme]?.fill ||
    !feature.get('style')?.[currentTheme]?.stroke
  ) {
    return
  }

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

export const setGranularityFeatureStyle = (feature) => {
  const currentTheme = getCurrentTheme()

  if (!feature.get('style')?.[currentTheme]?.fill) {
    return
  }

  const featureStyle = new Style({
    image: new Square({
      fill: new Fill({
        ...feature.get('style')[currentTheme]?.fill
      }),
      points: feature.get('points') || 4,
      radius: feature.get('size') || 10,
      angle: Math.PI / feature.get('angle') || Math.PI / 4
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
