<template>
  <div>
    <PrimeButton
      icon="pi pi-ellipsis-h"
      text
      aria-label="More options"
      size="small"
      aria-controls="overlay_menu"
      aria-haspopup="true"
      @click="toggle"
    />
    <PrimeMenu
      ref="optionsMenu"
      id="overlay_menu"
      :model="items"
      :popup="true"
      :pt="{
        submenuHeader: {
          class: 'hidden'
        }
      }"
    />
  </div>
</template>

<script setup>
  import { ref } from 'vue'
  import PrimeButton from 'primevue/button'
  import PrimeMenu from 'primevue/menu'

  const optionsMenu = ref()
  const items = ref([
    {
      items: [
        {
          label: 'Copy query',
          icon: 'pi pi-copy'
        },
        {
          label: 'Export CSV',
          icon: 'pi pi-download'
        }
      ]
    }
  ])

  const toggle = (event) => {
    optionsMenu.value.toggle(event)
  }
</script>
