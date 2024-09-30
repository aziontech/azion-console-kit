const LIMITS = {
  limit5: 1_000_000,
  limit4: 100_000,
  limit3: 10_000,
  limit2: 1000
}

const BUBBLE_SIZE = 15

const rangeVariations = (value, rangeVariation) => {
  if (value > LIMITS.limit5) return `${rangeVariation}-limit5`
  if (value >= LIMITS.limit4) return `${rangeVariation}-limit4`
  if (value >= LIMITS.limit3) return `${rangeVariation}-limit3`
  if (value >= LIMITS.limit2) return `${rangeVariation}-limit2`
  return `${rangeVariation}-limit1`
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
