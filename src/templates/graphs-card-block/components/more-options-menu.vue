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
  import { useHelperCenter } from '@/composables/use-helper-center'
  import { useLayout } from '@/composables/use-layout'
  import PrimeButton from 'primevue/button'
  import PrimeMenu from 'primevue/menu'
  import { computed, ref, toRef, inject } from 'vue'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const { toggleSidebarComponent } = useLayout()
  const { actions } = useHelperCenter()

  const props = defineProps({
    report: { type: Object, required: true },
    clipboardWrite: { type: Function, required: true },
    groupData: { type: Object, required: true }
  })

  const reportData = toRef(props, 'report')

  const optionsMenu = ref()

  const items = computed(() => {
    const options = {
      openHelpCenter: {
        label: 'Open Help Center',
        icon: 'pi pi-question-circle',
        command: () => openHelpCenter(),
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
        label: `${reportData.value.showMeanLine ? 'Hide' : 'Show'} Mean Line`,
        icon: reportData.value.showMeanLine ? 'pi pi-eye' : 'pi pi-eye-slash',
        command: () => toggleMeanLine(),
        show: reportData.value.hasMeanLine
      },
      showMeanLinePerSeries: {
        label: `${reportData.value.showMeanLinePerSeries ? 'Hide' : 'Show'} Mean Line per series`,
        icon: reportData.value.showMeanLinePerSeries ? 'pi pi-eye' : 'pi pi-eye-slash',
        command: () => toggleMeanLinePerSeries(),
        show: reportData.value.hasMeanLinePerSeries
      }
    }

    return Object.values(options).filter((option) => option.show)
  })

  const toggleMenu = (evt) => {
    optionsMenu.value.toggle(evt)
  }

  const openHelpCenter = async () => {
    clickedToRealTimeMetrics('helpCenter')
    await actions.setArticleContent({ url: reportData.value.helpCenterPath })
    toggleSidebarComponent('helper')
  }

  const exportCSV = () => {
    clickedToRealTimeMetrics('exportCsv')
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

  const copyQuery = async () => {
    clickedToRealTimeMetrics('copyQuery')
    const { query, variables } = reportData.value.reportQuery
    const clipboardQuery = formatGQL(query, variables)
    await props.clipboardWrite(clipboardQuery)
  }

  const formatGQL = (gql, variables) => {
    const removeSpaces = gql.replaceAll('  ', '')
    const lines = removeSpaces.split('\n')
    const filterEmptySpaces = lines.filter((ln) => ln.trim().length)
    let spaceAcc = 0
    const spaces = 2
    const arrMapIdents = filterEmptySpaces.map((ln) => {
      let identedLine = ln
      const openClojure = ['{', '(']
      const closeClojure = ['}', ')']
      const lastChar = ln.substr(ln.length - 1, 1)
      const firstChar = ln.trim().substr(0, 1)
      if (closeClojure.includes(lastChar) || closeClojure.includes(firstChar)) {
        spaceAcc -= spaces
      }
      if (spaceAcc < 0) spaceAcc = 0
      identedLine = ' '.repeat(spaceAcc) + identedLine
      if (openClojure.includes(lastChar)) {
        spaceAcc += spaces
      }
      return identedLine
    })
    const gqlIdented = arrMapIdents.join('\n')
    const gqlVariables = JSON.stringify(variables, null, 2)

    return `# QUERY\n\n${gqlIdented}\n\n\n# VARIABLES\n${gqlVariables}`
  }

  const toggleMeanLine = () => {
    clickedToRealTimeMetrics('showMeanLine')
    reportData.value.showMeanLine = !reportData.value.showMeanLine
  }

  const toggleMeanLinePerSeries = () => {
    clickedToRealTimeMetrics('showMeanLinePerSeries')
    reportData.value.showMeanLinePerSeries = !reportData.value.showMeanLinePerSeries
  }

  const clickedToRealTimeMetrics = (option) => {
    const eventName = 'Clicked on More Options on Real-Time Metrics'
    const payload = {
      section: props.groupData.current.value,
      page: props.groupData.currentPage.label,
      chart: props.report.label,
      option
    }
    tracker.realTimeMetrics
      .clickedToRealTimeMetrics({
        eventName,
        payload
      })
      .track()
  }
</script>
