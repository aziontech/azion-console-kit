<template>
  <div
    id="general-map"
    class="w-full h-96"
  />
  <MapTooltipBlock :data="tooltipProps" />
  <MapLegendBlock
    :title="legendProps.title"
    :captions="legendProps.caption"
  />
</template>

<script setup>
  import { onMounted, onUnmounted, ref, watch } from 'vue'
  import { useAccountStore } from '@/stores/account'
  import { storeToRefs } from 'pinia'
  import * as regions from './json/regions.json'
  import * as countries from './json/countries.json'
  import { setOceanFeature, setLandFeature, setLakeFeature, setFeatureStyle } from './utils'

  import { Map, View } from 'ol/index.js'
  import GeoJSON from 'ol/format/GeoJSON.js'
  import Circle from 'ol/geom/Circle.js'
  import { Vector as VectorSource } from 'ol/source.js'
  import { Vector as VectorLayer } from 'ol/layer.js'
  import { fromLonLat } from 'ol/proj.js'

  import MapLegendBlock from './map-chart-blocks/map-legend-block.vue'
  import MapTooltipBlock from './map-chart-blocks/map-tooltip-block.vue'

  import { BUBBLES_DATA, HEATMAP_DATA } from './constants/data'
  import { bubblesHandler, heatmapHandler } from './utils/features-handler'

  const map = ref(null)
  const tooltipProps = ref({})

  onMounted(() => {
    initMap()
    map.value.getTargetElement().addEventListener('pointerleave', hideTooltip)
  })

  onUnmounted(() => {
    map.value.getTargetElement().removeEventListener('pointerleave', hideTooltip)
  })

  const generateBubbles = () => {
    const bubbles = new GeoJSON().readFeatures(regions)

    bubbles.forEach((bubble) => {
      const bubbleData = bubblesHandler(bubble.get('name'), BUBBLES_DATA)

      if (!bubbleData) {
        return
      }

      bubble.setGeometry(
        new Circle(fromLonLat(bubble.getGeometry().getCoordinates()), bubbleData.size)
      )

      bubble.setProperties({
        kind: 'bubble',
        value: bubbleData.value
      })

      setFeatureStyle(bubble, bubbleData.variation)
    })

    return bubbles
  }

  const generateAreas = () => {
    const areas = new GeoJSON().readFeatures(countries, {
      featureProjection: 'EPSG:3857'
    })

    areas.forEach((area) => {
      const areaData = heatmapHandler(area.get('name'), HEATMAP_DATA)

      if (!areaData) {
        return
      }

      area.setProperties({
        kind: 'heatmap',
        value: areaData.value
      })

      setFeatureStyle(area, areaData.variation)
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

    map.value.on('pointermove', (event) => {
      if (event.dragging) {
        tooltipProps.value = {}
        return
      }

      const pixel = map.value.getEventPixel(event.originalEvent)

      displayHeatmapTooltip(pixel)
    })
  }

  const hideTooltip = () => {
    tooltipProps.value = {}
  }

  const displayHeatmapTooltip = (pixel) => {
    const feature = map.value.forEachFeatureAtPixel(pixel, (feature) => feature)

    if (feature && feature.get('kind')) {
      tooltipProps.value = {
        label: feature.get('name'),
        value: feature.get('value'),
        kind: feature.get('kind'),
        yAxis: pixel[1],
        xAxis: pixel[0]
      }
    } else {
      hideTooltip()
    }
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
