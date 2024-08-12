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
  import { onMounted, ref } from 'vue'
  import GeoJSON from 'ol/format/GeoJSON.js'
  import Map from 'ol/Map.js'
  import View from 'ol/View.js'
  import { OSM, Vector as VectorSource } from 'ol/source.js'
  import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer.js'
  import { Style, Fill, Stroke } from 'ol/style.js'
  import * as heatmapFeatures from './constants/heatmap-features.json'
  import LegendBlock from './components/legend-block.vue'
  import { setOceanFeature, setLandFeature, setLakeFeature } from './base-layers'

  const vectorLayer = new VectorLayer({
    source: new VectorSource({})
  })

  const heatmapMap = ref(null)
  const baseFeatures = ref({
    ocean: null,
    land: null,
    lake: null
  })

  onMounted(() => {
    initMap()
    setBaseLayers()
    displayHeatmap()
  })

  const setBaseLayers = () => {
    baseFeatures.value.ocean = setOceanFeature()
    baseFeatures.value.land = setLandFeature()
    baseFeatures.value.lake = setLakeFeature()

    vectorLayer
      .getSource()
      .addFeatures([
        ...baseFeatures.value.ocean,
        ...baseFeatures.value.land,
        ...baseFeatures.value.lake
      ])
  }

  const displayHeatmap = () => {
    const features = new GeoJSON().readFeatures(heatmapFeatures, {
      featureProjection: 'EPSG:3857'
    })

    features.forEach((feature) => {
      const featureStyle = new Style({
        fill: new Fill({
          ...feature.get('fill')
        }),
        stroke: new Stroke({
          ...feature.get('stroke')
        })
      })
      feature.setStyle(featureStyle)
    })

    vectorLayer.getSource().addFeatures(features)
  }

  const initMap = () => {
    heatmapMap.value = new Map({
      layers: [
        new TileLayer({
          source: new OSM()
        }),
        vectorLayer
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
</script>

<style lang="scss">
  #heatmap-map .ol-viewport {
    border-radius: 0.25rem;
  }
</style>
