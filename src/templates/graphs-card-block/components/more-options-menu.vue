<template>
  <div>
    <PrimeButton
      icon="pi pi-ellipsis-h"
      outlined
      aria-label="More options"
      size="small"
      aria-controls="overlay_menu"
      aria-haspopup="true"
      @click="toggleMenu"
    />
    <PrimeMenu
      ref="optionsMenu"
      id="overlay_menu"
      :model="items"
      :popup="true"
      :pt="{ submenuHeader: { class: 'hidden' } }"
      class="w-fit"
    />
  </div>
</template>

<script setup>
  import PrimeButton from 'primevue/button'
  import PrimeMenu from 'primevue/menu'
  import { computed, ref } from 'vue'

  const props = defineProps({
    hasMeanLine: Boolean,
    hasMeanLinePerSeries: Boolean
  })

  const showMeanLine = ref(true)
  const showMeanLinePerSeries = ref(true)

  const optionsMenu = ref()

  const items = computed(() => {
    const options = {
      playground: {
        label: 'GraphQL Playground',
        icon: 'pi pi-external-link',
        command: () => openPlayground(),
        show: true
      },
      copyQuery: {
        label: 'Copy query',
        icon: 'pi pi-copy',
        command: () => copyQuery(),
        show: true
      },
      exportCsv: {
        label: 'Export CSV',
        icon: 'pi pi-download',
        command: () => exportCsv(),
        show: true
      },
      showMeanLine: {
        label: `${showMeanLine.value ? 'Show' : 'Hide'} Mean Line`,
        icon: showMeanLine.value ? 'pi pi-eye-slash' : 'pi pi-eye',
        command: () => toggleMeanLine(),
        show: props.hasMeanLine
      },
      showMeanLinePerSeries: {
        label: `${showMeanLinePerSeries.value ? 'Show' : 'Hide'} Mean Line per series`,
        icon: showMeanLinePerSeries.value ? 'pi pi-eye-slash' : 'pi pi-eye',
        command: () => toggleMeanLinePerSeries(),
        show: props.hasMeanLinePerSeries
      }
    }

    return Object.values(options).filter((option) => option.show)
  })

  const toggleMenu = (evt) => {
    optionsMenu.value.toggle(evt)
  }

  const openPlayground = () => {
    return null
  }

  const copyQuery = () => {
    return null
  }

  const exportCsv = () => {
    return null
  }

  const toggleMeanLine = () => {
    showMeanLine.value = !showMeanLine.value
    return null
  }

  const toggleMeanLinePerSeries = () => {
    showMeanLinePerSeries.value = !showMeanLinePerSeries.value
    return null
  }
</script>
