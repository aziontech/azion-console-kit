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
  import Feature from 'ol/Feature.js'
  import Point from 'ol/geom/Point.js'
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

  const displayGranularities = () => {
    granularityFeatures.features.forEach((feature) => {
      const {
        properties: { coordinates, size },
        style: { fill }
      } = feature

      const newFeat = new Feature(new Point(fromLonLat(coordinates)))

      newFeat.setStyle(
        new Style({
          image: new Square({
            fill: new Fill({
              color: fill
            }),
            points: 4,
            radius: size,
            angle: Math.PI / 4
          })
        })
      )

      vectorLayer.getSource().addFeature(newFeat)
    })
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
