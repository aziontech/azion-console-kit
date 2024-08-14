<template>
  <div
    id="general-map"
    class="w-full h-96"
  />
  <div
    ref="tooltipRef"
    class="tooltip-heatmap"
  />
  <LegendBlock
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

  import LegendBlock from './components/legend-block.vue'

  import { BUBBLES_DATA, HEATMAP_DATA } from './constants/data'
  import { bubblesHandler, heatmapHandler } from './utils/features-handler'

  const map = ref(null)
  const tooltipRef = ref(null)

  onMounted(() => {
    initMap()

    map.value.getTargetElement().addEventListener('pointerleave', hideTooltip)
  })

  onUnmounted(() => {
    map.value.getTargetElement().removeEventListener('pointerleave', hideTooltip)
  })

  const hideTooltip = () => {
    tooltipRef.value.style.display = 'none'
  }

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
        kind: 'heatMap',
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
        tooltipRef.value.style.display = 'none'
        return
      }

      const pixel = map.value.getEventPixel(event.originalEvent)

      displayHeatmapTooltip(pixel)
    })

    map.value.on('pointerleave', () => {
      tooltipRef.value.style.display = 'none'
    })
  }

  const displayHeatmapTooltip = (pixel) => {
    const feature = map.value.forEachFeatureAtPixel(pixel, (feature) => feature)

    if (feature && feature.get('kind') === 'heatMap') {
      tooltipRef.value.style.left = `${pixel[0]}px`
      tooltipRef.value.style.top = `${pixel[1] - 15}px`
      tooltipRef.value.innerHTML = `<p>${feature.get('name')}</p><p>${feature.get('value')}</p>`
      tooltipRef.value.style.display = 'block'
    } else {
      tooltipRef.value.style.display = 'none'
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

  .tooltip-heatmap {
    position: absolute;
    background: white;
    border: 1px solid black;
    padding: 5px;
    border-radius: 3px;
    pointer-events: none;
    display: none;
    z-index: 100;
  }
</style>
