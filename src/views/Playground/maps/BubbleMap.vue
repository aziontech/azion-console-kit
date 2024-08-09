<template>
  <div
    id="bubble-map"
    class="w-full h-96"
  />
</template>

<script setup>
  import { onMounted, ref } from 'vue'
  import GeoJSON from 'ol/format/GeoJSON.js'
  import Circle from 'ol/geom/Circle.js'
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

  const styleFeatures = () => {
    const features = new GeoJSON().readFeatures(bubbleFeatures)

    features.forEach((feature) => {
      feature.setGeometry(
        new Circle(fromLonLat(feature.getGeometry().getCoordinates()), feature.get('size'))
      )

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

    return features
  }

  const displayBubbles = () => {
    const features = styleFeatures()
    vectorLayer.getSource().addFeatures(features)
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
