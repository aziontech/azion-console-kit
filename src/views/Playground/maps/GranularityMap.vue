<template>
  <div
    id="granularity-map"
    class="w-full h-96"
  />
</template>

<script setup>
  import { onMounted, ref } from 'vue'
  import Map from 'ol/Map.js'
  import View from 'ol/View.js'
  import Point from 'ol/geom/Point.js'
  import GeoJSON from 'ol/format/GeoJSON.js'
  import { Fill, Style, RegularShape as Square } from 'ol/style.js'
  import { OSM, Vector as VectorSource } from 'ol/source.js'
  import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer.js'
  import { fromLonLat } from 'ol/proj.js'
  import { DragPan } from 'ol/interaction'

  import * as granularityFeatures from './constants/granularity-features.json'

  const vectorLayer = new VectorLayer({
    source: new VectorSource({})
  })

  const granularityMap = ref(null)

  onMounted(() => {
    initMap()
    displayGranularities()
  })

  const styleFeatures = () => {
    const features = new GeoJSON().readFeatures(granularityFeatures)

    features.forEach((feature) => {
      feature.setGeometry(new Point(fromLonLat(feature.getGeometry().getCoordinates())))

      const featureStyle = new Style({
        image: new Square({
          fill: new Fill({
            ...feature.get('fill')
          }),
          points: feature.get('points'),
          radius: feature.get('size'),
          angle: Math.PI / feature.get('angle')
        })
      })

      feature.setStyle(featureStyle)
    })

    return features
  }

  const displayGranularities = () => {
    const features = styleFeatures()
    vectorLayer.getSource().addFeatures(features)
  }

  const initMap = () => {
    granularityMap.value = new Map({
      layers: [
        new TileLayer({
          source: new OSM()
        }),
        vectorLayer
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
</script>

<style lang="scss">
  .azion-dark #granularity-map .ol-layer canvas {
    filter: invert(100%) hue-rotate(180deg) saturate(0.75) contrast(1);
  }
</style>
