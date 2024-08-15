import { Style, Fill, Stroke } from 'ol/style.js'

import { useAccountStore } from '@/stores/account'
import { storeToRefs } from 'pinia'

import { VARIATIONS } from '../constants/color-scheme'

const getCurrentTheme = () => {
  const accountStore = useAccountStore()
  const { currentTheme } = storeToRefs(accountStore)

  if (currentTheme.value === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  return currentTheme.value
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
