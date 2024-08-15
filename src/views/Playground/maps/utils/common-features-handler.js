/*
  This file contains the styling for the base features
  that are common to all maps: lakes, oceans and lands.
*/

import GeoJSON from 'ol/format/GeoJSON.js'

import * as lakesLayer from '../json/lakes'
import * as landsLayer from '../json/land'
import * as oceansLayer from '../json/ocean'

import { setFeatureStyle } from './features-styler'

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
