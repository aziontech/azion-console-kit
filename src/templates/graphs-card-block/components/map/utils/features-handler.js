const LIMITS = {
  high: 100_000,
  mediumHigh: 10_000,
  mediumLow: 1_000,
  low: 100
}

const BUBBLE_SIZE = 15

const rangeVariations = (value, rangeVariation) => {
  switch (true) {
    case value >= LIMITS.high:
      return `${rangeVariation}-high`
    case value >= LIMITS.mediumHigh:
      return `${rangeVariation}-medium-high`
    case value >= LIMITS.low:
      return `${rangeVariation}-medium-low`
    default:
      return `${rangeVariation}-low`
  }
}

export const bubblesHandler = (name, data) => {
  const featureData = data.find((feature) => feature.countryName === name)

  if (!featureData?.value) {
    return
  }

  return {
    variation: rangeVariations(featureData.value, featureData.rangeVariation),
    size: featureData.value * BUBBLE_SIZE,
    value: featureData.value
  }
}

export const heatmapHandler = (name, data) => {
  const featureData = data.find((feature) => feature.countryName === name)

  if (!featureData?.value) {
    return
  }

  return {
    variation: rangeVariations(featureData.value, featureData.rangeVariation),
    value: featureData.value,
    exhibitionValue: featureData.exhibitionValue
  }
}
