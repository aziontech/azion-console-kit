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
  import { useMetricsStore } from '@/stores/metrics'
  import { storeToRefs } from 'pinia'
  import PrimeButton from 'primevue/button'
  import PrimeMenu from 'primevue/menu'
  import { computed, ref } from 'vue'

  const { getCurrentReportsDataById } = storeToRefs(useMetricsStore())

  const props = defineProps({
    hasMeanLine: Boolean,
    hasMeanLinePerSeries: Boolean,
    reportId: String
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
        command: () => exportCSV(),
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

  const reportData = computed(() => {
    return getCurrentReportsDataById.value(props.reportId)
  })

  const openPlayground = () => {
    return null
  }

  const copyQuery = () => {
    return null
  }

  const exportCSV = () => {
    const csvFormattedSheet = generateCSV()
    if (!csvFormattedSheet) return false

    const blobCSVFormat = new Blob([csvFormattedSheet], { type: 'text/csv' })
    const urlStringified = window.URL.createObjectURL(blobCSVFormat)
    const elementAnchor = document.createElement('a')
    elementAnchor.setAttribute('href', urlStringified)
    elementAnchor.setAttribute('download', `${reportData.value.label}.csv`)
    elementAnchor.click()
    return true
  }

  const generateCSV = () => {
    const sheet = []
    reportData.value.resultQuery[0].forEach((__, rowIdx) => {
      const rotatedValues = reportData.value.resultQuery.reduce((prev, curr) => {
        let rowValue = curr[rowIdx]
        const isDate = rowValue instanceof Date && !Number.isNaN(rowValue.valueOf())
        if (isDate) {
          rowValue = rowValue.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })
        }
        return [...prev, rowValue]
      }, [])
      sheet.push(rotatedValues.join(';'))
    })
    const csvFormattedSheet = sheet.join('\n')
    return csvFormattedSheet
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
