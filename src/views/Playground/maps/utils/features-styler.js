import { Style, Fill, Stroke } from 'ol/style.js'

import { useAccountStore } from '@/stores/account'
import { storeToRefs } from 'pinia'

import { VARIATIONS, COMMON_LAYERS_COLORS } from '../constants/color-scheme'

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
      ...feature.get('style')[currentTheme]
    }
  }

  return {
    fill: { color: VARIATIONS[variation][currentTheme].fillColor },
    stroke: { color: VARIATIONS[variation][currentTheme].strokeColor, width: 1 },
    zIndex: 1
  }
}

export const setFeatureStyle = (feature, variation = null) => {
  if (!feature.get('style') && !variation) {
    feature.setProperties({
      ...COMMON_LAYERS_COLORS[feature.get('layer')]
    })
  }

  const styleValues = getStyleValues(feature, variation)

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
