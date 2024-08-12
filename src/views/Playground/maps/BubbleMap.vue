<template>
  <div
    id="bubble-map"
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
  import Circle from 'ol/geom/Circle.js'
  import Map from 'ol/Map.js'
  import View from 'ol/View.js'
  import { Fill, Stroke, Style } from 'ol/style.js'
  import { OSM, Vector as VectorSource } from 'ol/source.js'
  import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer.js'
  import { fromLonLat } from 'ol/proj.js'
  import * as bubbleFeatures from './constants/bubble-features.json'
  import LegendBlock from './components/legend-block.vue'
  import { setOceanFeature, setLandFeature, setLakeFeature } from './base-layers'

  const vectorLayer = new VectorLayer({
    source: new VectorSource({})
  })

  const bubbleMap = ref(null)
  const baseFeatures = ref({
    ocean: null,
    land: null,
    lake: null
  })

  onMounted(() => {
    initMap()
    setBaseLayers()
    displayBubbles()
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
  #bubble-map .ol-viewport {
    border-radius: 0.25rem;
  }
</style>
