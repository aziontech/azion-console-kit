<template>
  <div
    id="general-map"
    class="w-full h-96 [&>.ol-viewport]:rounded"
    ref="mapTemplateRef"
  />
  <MapTooltipBlock :data="tooltipProps" />
  <MapLegendBlock
    v-if="legendProps.show"
    :title="legendProps.title"
    :captions="legendProps.caption"
  />
</template>

<script setup>
  import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
  import { onClickOutside } from '@vueuse/core'
  import { useAccountStore } from '@/stores/account'
  import { storeToRefs } from 'pinia'
  import * as countries from './json/countries.json'
  import {
    setOceanFeature,
    setCountryFeature,
    setLakeFeature
  } from './utils/common-features-handler'
  import { setFeatureStyle } from './utils/features-styler'
  import { heatmapHandler } from './utils/features-handler'

  import { Map, View } from 'ol/index.js'
  import GeoJSON from 'ol/format/GeoJSON.js'
  import { Vector as VectorSource } from 'ol/source.js'
  import { Vector as VectorLayer } from 'ol/layer.js'

  import MapLegendBlock from './map-chart-blocks/map-legend-block.vue'
  import MapTooltipBlock from './map-chart-blocks/map-tooltip-block.vue'

  const props = defineProps({
    resultChart: Array
  })

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

  const generateAreas = computed(() => {
    const areas = new GeoJSON().readFeatures(countries)

    areas.forEach((area) => {
      const areaData = heatmapHandler(area.get('name'), props.resultChart[0].heatmap)

      if (!areaData) {
        return
      }

      const geometry = area.getGeometry()
      const transformedGeometry = geometry.transform('EPSG:4326', 'EPSG:3857')
      area.setGeometry(transformedGeometry)

      area.setProperties({
        kind: 'heatmap',
        value: areaData.value
      })

      setFeatureStyle(area, areaData.variation)
    })

    return areas
  })

  const initMap = () => {
    map.value = new Map({
      layers: [
        new VectorLayer({
          source: new VectorSource({
            features: [
              ...setOceanFeature(),
              ...setCountryFeature(),
              ...setLakeFeature(),
              ...generateAreas.value
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

  const rerenderMap = () => {
    map.value.setTarget(null)
    map.value = null
    initMap()
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

  const legendProps = computed(() => {
    const addedFeatures = map.value?.getAllLayers()[0]?.getSource()?.getFeatures() || []
    const getFeaturesKinds = addedFeatures
      .map((feature) => feature.get('kind'))
      .filter((value, index, self) => self.indexOf(value) === index && value)

    return {
      show: getFeaturesKinds.length === 1,
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
  })

  const { currentTheme } = storeToRefs(useAccountStore())
  watch(currentTheme, () => {
    rerenderMap()
  })
</script>
