<template>
  <div
    id="bubble-map"
    class="w-full h-96"
  />
</template>

<script setup>
  import { onMounted, ref } from 'vue'
  import Circle from 'ol/geom/Circle.js'
  import Feature from 'ol/Feature.js'
  import Map from 'ol/Map.js'
  import View from 'ol/View.js'
  import { Fill, Stroke, Style } from 'ol/style.js'
  import { OSM, Vector as VectorSource } from 'ol/source.js'
  import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer.js'
  import { fromLonLat } from 'ol/proj.js'
  import * as bubbleFeatures from './constants/bubble-features.json'

  const vectorLayer = new VectorLayer({
    source: new VectorSource({})
  })

  const bubbleMap = ref(null)

  onMounted(() => {
    initMap()
    displayBubbles()
  })

  const displayBubbles = () => {
    bubbleFeatures.features.forEach((feature) => {
      const {
        geometry: { coordinates },
        properties: { size, stroke, fill }
      } = feature

      const newFeat = new Feature(new Circle(fromLonLat(coordinates), size))

      newFeat.setStyle(
        new Style({
          stroke: new Stroke({
            ...stroke
          }),
          fill: new Fill({
            ...fill
          })
        })
      )

      vectorLayer.getSource().addFeature(newFeat)
    })
  }

  const initMap = () => {
    bubbleMap.value = new Map({
      layers: [
        new TileLayer({
          source: new OSM()
        }),
        vectorLayer
      ],
      target: 'bubble-map',
      view: new View({
        center: [0, 0],
        zoom: 2
      }),
      controls: []
    })
  }
</script>
