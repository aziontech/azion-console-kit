<template>
  <div
    id="heatmap-map"
    class="w-full h-96"
  />
  <LegendBlock
    :title="legendProps.title"
    :captions="legendProps.caption"
  />
</template>

<script setup>
  import { onMounted, ref, watch } from 'vue'
  import { useAccountStore } from '@/stores/account'
  import { storeToRefs } from 'pinia'
  import * as heatmapFeatures from './constants/heatmap-features.json'
  import { setOceanFeature, setLandFeature, setLakeFeature, setFeatureStyle } from './base-layers'

  import GeoJSON from 'ol/format/GeoJSON.js'
  import Map from 'ol/Map.js'
  import View from 'ol/View.js'
  import { Vector as VectorSource } from 'ol/source.js'
  import { Vector as VectorLayer } from 'ol/layer.js'

  import LegendBlock from './components/legend-block.vue'

  const heatmapMap = ref(null)

  onMounted(() => {
    initMap()
  })

  const generateAreas = () => {
    const areas = new GeoJSON().readFeatures(heatmapFeatures, {
      featureProjection: 'EPSG:3857'
    })

    areas.forEach((area) => {
      setFeatureStyle(area)
    })

    return areas
  }

  const initMap = () => {
    heatmapMap.value = new Map({
      layers: [
        new VectorLayer({
          source: new VectorSource({
            features: [
              ...setOceanFeature(),
              ...setLandFeature(),
              ...setLakeFeature(),
              ...generateAreas()
            ]
          })
        })
      ],
      target: 'heatmap-map',
      view: new View({
        center: [0, 0],
        zoom: 1
      }),
      controls: []
    })
  }

  const legendProps = {
    title: 'Total accesses:',
    caption: [
      {
        label: '100.000 accesses',
        bullet: 'bg-red-500 border-red-500'
      },
      {
        label: '10.000 accesses',
        bullet: 'bg-orange-500 border-orange-500'
      },
      {
        label: '1.000 accesses',
        bullet: 'bg-yellow-500 border-yellow-500'
      },
      {
        label: '< 100 accesses',
        bullet: 'bg-green-500 border-green-500'
      }
    ]
  }

  const { currentTheme } = storeToRefs(useAccountStore())
  watch(currentTheme, () => {
    heatmapMap.value
      .getAllLayers()[0]
      .getSource()
      .getFeatures()
      .forEach((feature) => {
        setFeatureStyle(feature)
      })
  })
</script>

<style lang="scss">
  #heatmap-map .ol-viewport {
    border-radius: 0.25rem;
  }
</style>
