<template>
  <div
    id="general-map"
    class="w-full h-96 [&>.ol-viewport]:rounded"
    ref="mapTemplateRef"
  />
  <MapTooltipBlock :data="tooltipProps" />
  <MapLegendBlock
    :title="legendProps.title"
    :captions="legendProps.caption"
  />
</template>

<script setup>
  import { onMounted, onUnmounted, ref, watch } from 'vue'
  import { onClickOutside } from '@vueuse/core'
  import { useAccountStore } from '@/stores/account'
  import { storeToRefs } from 'pinia'
  import * as regions from './json/regions.json'
  import * as countries from './json/countries.json'
  import { setOceanFeature, setLandFeature, setLakeFeature } from './utils/common-features-handler'
  import { setFeatureStyle } from './utils/features-styler'
  import { bubblesHandler, heatmapHandler } from './utils/features-handler'

  import { Map, View } from 'ol/index.js'
  import GeoJSON from 'ol/format/GeoJSON.js'
  import Circle from 'ol/geom/Circle.js'
  import { Vector as VectorSource } from 'ol/source.js'
  import { Vector as VectorLayer } from 'ol/layer.js'
  import { fromLonLat } from 'ol/proj.js'

  import MapLegendBlock from './map-chart-blocks/map-legend-block.vue'
  import MapTooltipBlock from './map-chart-blocks/map-tooltip-block.vue'

  import { MOCK_BUBBLES_DATA, MOCK_HEATMAP_DATA } from './constants/data'

  const mapTemplateRef = ref(null)
  const map = ref(null)
  const tooltipProps = ref({})

  onMounted(() => {
    initMap()
    map.value.getTargetElement().addEventListener('pointerleave', hideTooltip)
  })

  onUnmounted(() => {
    map.value.getTargetElement().removeEventListener('pointerleave', hideTooltip)
  })

  onClickOutside(mapTemplateRef, () => hideTooltip())

  const generateBubbles = () => {
    const bubbles = new GeoJSON().readFeatures(regions)

    bubbles.forEach((bubble) => {
      const bubbleData = bubblesHandler(bubble.get('name'), MOCK_BUBBLES_DATA)

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
      const areaData = heatmapHandler(area.get('name'), MOCK_HEATMAP_DATA)

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
      handleTooltipByEvent(event)
    })

    map.value.on('singleclick', (event) => {
      handleTooltipByEvent(event)
    })
  }

  const handleTooltipByEvent = (event) => {
    if (event.dragging) {
      tooltipProps.value = {}
      return
    }

    const pixel = map.value.getEventPixel(event.originalEvent)

    displayTooltip(pixel)
  }

  const hideTooltip = () => {
    tooltipProps.value = {}
  }

  const displayTooltip = (pixel) => {
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
        bullet: 'bg-scale-red border-scale-red'
      },
      {
        label: '10.000 accesses',
        bullet: 'bg-scale-orange border-scale-orange'
      },
      {
        label: '1.000 accesses',
        bullet: 'bg-scale-yellow border-scale-yellow'
      },
      {
        label: '< 100 accesses',
        bullet: 'bg-scale-green border-scale-green'
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
