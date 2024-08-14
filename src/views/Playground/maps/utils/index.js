import GeoJSON from 'ol/format/GeoJSON.js'
import { Style, Fill, Stroke } from 'ol/style.js'

import { useAccountStore } from '@/stores/account'
import { storeToRefs } from 'pinia'

import * as lakesLayer from '../json/lakes'
import * as landsLayer from '../json/land'
import * as oceansLayer from '../json/ocean'
import { VARIATIONS } from '../constants/color-scheme'

const getCurrentTheme = () => {
  const accountStore = useAccountStore()
  const { currentTheme } = storeToRefs(accountStore)

  if (currentTheme.value === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  return currentTheme.value
}

const setBaseFeatureData = (jsonData) => {
  const features = new GeoJSON().readFeatures(jsonData, {
    featureProjection: 'EPSG:3857'
  })

  features.forEach((feature) => {
    setFeatureStyle(feature)
  })

  return features
}

export const setOceanFeature = () => {
  const oceanFeatures = setBaseFeatureData(oceansLayer)

  return oceanFeatures
}

export const setLandFeature = () => {
  const landFeatures = setBaseFeatureData(landsLayer)

  return landFeatures
}

export const setLakeFeature = () => {
  const lakesFeatures = setBaseFeatureData(lakesLayer)

  return lakesFeatures
}

const getStyleValues = (feature, variation) => {
  const currentTheme = getCurrentTheme()

  if (!variation) {
    return {
      fill: feature.get('style')[currentTheme].fill,
      stroke: feature.get('style')[currentTheme].stroke
    }
  }

  return {
    fill: { color: VARIATIONS[variation][currentTheme].fillColor },
    stroke: { color: VARIATIONS[variation][currentTheme].strokeColor, width: 2 }
  }
}

export const setFeatureStyle = (feature, variation = null) => {
  const styleValues = getStyleValues(feature, variation)

  if (!styleValues) {
    return
  }

  const featureStyle = new Style({
    fill: new Fill({
      ...styleValues.fill
    }),
    stroke: new Stroke({
      ...styleValues.stroke
    })
  })

  feature.setStyle(featureStyle)
}
