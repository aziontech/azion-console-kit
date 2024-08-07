<template>
  <div class="flex flex-col gap-2 justify-center items-center">
    <div
      id="map"
      class="map h-96"
    />
    <div id="markers" />
  </div>
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
  .map {
    width: 100%;
    height: 900px;
  }

  .popup {
    background: #f3652b;
    border: 1px solid #f3652b;
    transition:
      background-color 0.2s,
      color 0.2s,
      border-color 0.2s,
      box-shadow 0.2s;
    width: 12px;
    height: 12px;
    border-radius: 12px;
  }

  .popup::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 20px;
    height: 20px;
    background-color: rgba(103, 103, 103, 0.2);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    animation: expand 2s infinite;
  }

  @keyframes expand {
    0%,
    100% {
      width: 20px;
      height: 20px;
      opacity: 1.5;
    }
    50% {
      width: 100px;
      height: 100px;
      opacity: 1;
    }
  }
</style>
