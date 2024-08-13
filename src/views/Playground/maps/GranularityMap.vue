<template>
  <div
    id="granularity-map"
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
  import * as granularityFeatures from './constants/granularity-features.json'
  import {
    setOceanFeature,
    setLandFeature,
    setLakeFeature,
    setFeatureStyle,
    setGranularityFeatureStyle
  } from './base-layers'

  import Map from 'ol/Map.js'
  import View from 'ol/View.js'
  import GeoJSON from 'ol/format/GeoJSON.js'
  import Point from 'ol/geom/Point.js'
  import { Vector as VectorSource } from 'ol/source.js'
  import { Vector as VectorLayer } from 'ol/layer.js'
  import { fromLonLat } from 'ol/proj.js'
  import { DragPan } from 'ol/interaction'

  import LegendBlock from './components/legend-block.vue'

  const granularityMap = ref(null)

  onMounted(() => {
    initMap()
  })

  const generateGranularity = () => {
    const granularity = new GeoJSON().readFeatures(granularityFeatures)

    granularity.forEach((granularity) => {
      granularity.setGeometry(new Point(fromLonLat(granularity.getGeometry().getCoordinates())))

      setGranularityFeatureStyle(granularity)
    })

    return granularity
  }

  const initMap = () => {
    granularityMap.value = new Map({
      layers: [
        new VectorLayer({
          source: new VectorSource({
            features: [
              ...setOceanFeature(),
              ...setLandFeature(),
              ...setLakeFeature(),
              ...generateGranularity()
            ]
          })
        })
      ],
      target: 'granularity-map',
      view: new View({
        center: fromLonLat([-46.6333, -23.5505]),
        zoom: 4
      }),
      controls: [],
      interactions: [new DragPan()]
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
    granularityMap.value
      .getAllLayers()[0]
      .getSource()
      .getFeatures()
      .forEach((feature, idx) => {
        if (idx === 3) {
          // granularity feature index
          setGranularityFeatureStyle(feature)
        } else {
          setFeatureStyle(feature)
        }
      })
  })
</script>

<style lang="scss">
  #granularity-map .ol-viewport {
    border-radius: 0.25rem;
  }
</style>
