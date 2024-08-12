<template>
  <div
    id="geolocation-map"
    class="w-full h-96"
  />
  <div id="markers" />
</template>

<script setup>
  import { Map, Overlay, View } from 'ol/index.js'
  import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer.js'
  import { OSM, Vector as VectorSource } from 'ol/source.js'
  import { onMounted, ref } from 'vue'
  import { fromLonLat } from 'ol/proj.js'
  import { coordinates } from './constants/coordinates'
  import { setOceanFeature, setLandFeature, setLakeFeature } from './base-layers'

  const vectorLayer = new VectorLayer({
    source: new VectorSource({})
  })

  const geolocationMap = ref(null)

  onMounted(() => {
    initMap()
    setBaseLayers()
    generateGeoJsonBrazil()
  })

  const initMap = () => {
    geolocationMap.value = new Map({
      layers: [
        new TileLayer({
          source: new OSM()
        }),
        vectorLayer
      ],
      target: 'geolocation-map',
      view: new View({
        center: fromLonLat([-49.470977003699666, -13.471216164769693]),
        zoom: 2
      }),
      controls: []
    })
  }

  const setBaseLayers = () => {
    setOceanFeature(vectorLayer)
    setLandFeature(vectorLayer)
    setLakeFeature(vectorLayer)
  }

  const generateGeoJsonBrazil = () => {
    coordinates.forEach((coordinate, index) => {
      createMarker(index)
      createOverlay(coordinate, index)
    })
  }

  const createMarker = (position) => {
    const div = document.createElement('div')
    div.className = 'popup'
    div.id = `marker-${position}`
    document.getElementById('markers').appendChild(div)
  }

  const createOverlay = (coordinate, position) => {
    const marker = new Overlay({
      position: fromLonLat(coordinate),
      positioning: 'center-center',
      element: document.getElementById(`marker-${position}`),
      stopEvent: false
    })

    geolocationMap.value.addOverlay(marker)
  }
</script>

<style lang="scss">
  #geolocation-map .ol-viewport {
    border-radius: 0.25rem;
  }

  .popup {
    background: #f3652b;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0% {
      transform: scale(0.95);
      box-shadow: 0 0 rgba(150, 150, 150, 0.7);
    }

    70% {
      transform: scale(1);
      box-shadow: 0 0 0 8px rgba(150, 150, 150, 0);
    }

    100% {
      transform: scale(0.95);
      box-shadow: 0 0 rgba(150, 150, 150, 0);
    }
  }
</style>
