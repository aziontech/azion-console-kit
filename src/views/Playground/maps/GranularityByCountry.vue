<template>
  <div
    id="map"
    class="w-full h-96"
  />
  <div id="markers" />
</template>

<script setup>
  import { Map, Overlay, View } from 'ol/index.js'
  import { Tile as TileLayer } from 'ol/layer.js'
  import { OSM } from 'ol/source.js'
  import { onMounted, ref } from 'vue'
  import { fromLonLat } from 'ol/proj.js'
  import { coordinates } from './constants/coordinates'

  const map = ref(null)

  onMounted(() => {
    map.value = new Map({
      layers: [
        new TileLayer({
          source: new OSM()
        })
      ],
      target: 'map',
      view: new View({
        center: fromLonLat([-49.470977003699666, -13.471216164769693]),
        zoom: 2
      })
    })

    generateGeoJsonBrazil()
  })

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

    map.value.addOverlay(marker)
  }
</script>

<style>
  .popup {
    background: #f3652b;
    border: 1px solid #f3652b;
    width: 12px;
    height: 12px;
    border-radius: 12px;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0% {
      transform: scale(0.95);
      box-shadow: 0 0 rgba(100, 100, 100, 0.7);
    }

    70% {
      transform: scale(1);
      box-shadow: 0 0 0 10px rgba(100, 100, 100, 0);
    }

    100% {
      transform: scale(0.95);
      box-shadow: 0 0 rgba(100, 100, 100, 0);
    }
  }
</style>
