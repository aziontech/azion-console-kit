<template>
  <div
    id="general-map"
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
  import * as bubblesFeatures from './json/bubbles.json'
  import * as heatmapFeatures from './json/heatmap.json'
  import { setOceanFeature, setLandFeature, setLakeFeature, setFeatureStyle } from './utils'

  import { Map, View } from 'ol/index.js'
  import GeoJSON from 'ol/format/GeoJSON.js'
  import Circle from 'ol/geom/Circle.js'
  import { Vector as VectorSource } from 'ol/source.js'
  import { Vector as VectorLayer } from 'ol/layer.js'
  import { fromLonLat } from 'ol/proj.js'

  import LegendBlock from './components/legend-block.vue'

  const map = ref(null)

  onMounted(() => {
    initMap()
  })

  const regionsVariations = ['Rio de Janeiro', 'Moscow', 'China', 'Brazil']

  const generateBubbles = () => {
    const bubbles = new GeoJSON().readFeatures(bubblesFeatures)

    bubbles.forEach((bubble) => {
      bubble.setGeometry(
        new Circle(fromLonLat(bubble.getGeometry().getCoordinates()), bubble.get('size'))
      )
      if (regionsVariations.includes(bubble.get('name'))) {
        setFeatureStyle(bubble, 'positive-regular-low')
      } else {
        setFeatureStyle(bubble, 'positive-regular-medium-high')
      }
    })

    return bubbles
  }

  const generateAreas = () => {
    const areas = new GeoJSON().readFeatures(heatmapFeatures, {
      featureProjection: 'EPSG:3857'
    })

    areas.forEach((area) => {
      if (regionsVariations.includes(area.get('name'))) {
        setFeatureStyle(area, 'negative-regular-low')
      } else {
        setFeatureStyle(area, 'negative-regular-medium-high')
      }
    })

    return areas
  }

  const initMap = () => {
    map.value = new Map({
      layers: [
        new VectorLayer({
          source: new VectorSource({
            features: [
              ...setOceanFeature(),
              ...setLandFeature(),
              ...setLakeFeature(),
              ...generateBubbles(),
              ...generateAreas()
            ]
          })
        })
      ],
      target: 'general-map',
      view: new View({
        center: [0, 0],
        zoom: 2
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
    map.value
      .getAllLayers()[0]
      .getSource()
      .getFeatures()
      .forEach((feature) => {
        if (feature.get('base')) {
          setFeatureStyle(feature)
        }
      })
  })
</script>

<style lang="scss">
  #general-map .ol-viewport {
    border-radius: 0.25rem;
  }
</style>
./json
