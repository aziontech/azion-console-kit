<template>
  <div
    id="granularity-map"
    class="w-full h-96"
  />
  <LegendBlock
    :title="legendProps.title"
    :captions="legendProps.caption"
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
  import LegendBlock from './components/legend-block.vue'
  import { setOceanFeature, setLandFeature, setLakeFeature } from './base-layers'

  const vectorLayer = new VectorLayer({
    source: new VectorSource({})
  })

  const granularityMap = ref(null)
  const baseFeatures = ref({
    ocean: null,
    land: null,
    lake: null
  })

  onMounted(() => {
    initMap()
    setBaseLayers()
    displayGranularities()
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
  #granularity-map .ol-viewport {
    border-radius: 0.25rem;
  }
</style>
