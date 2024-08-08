<template>
  <div
    id="heatmap-map"
    class="w-full h-96"
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

  const vectorLayer = new VectorLayer({
    source: new VectorSource({})
  })

  const heatmapMap = ref(null)

  onMounted(() => {
    initMap()
    displayHeatmap()
  })

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
</script>
