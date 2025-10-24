<template>
  <PrimeButton
    outlined
    class="surface-section min-w-fit hover:surface-hover whitespace-nowrap"
    icon="pi pi-circle-fill"
    size="small"
    :label="label"
    :loading="!label"
    :pt="{
      root: { class: 'h-8 flex-row items-center' },
      label: { class: 'font-normal text-sm min-w-[9rem]' },
      icon: { style: colorStatus, class: 'text-xs' }
    }"
    @click="redirectToLink"
  />
</template>

<script>
  import {
    loadStatusPageService,
    loadComponentsStatusService
  } from '@/services/status-page-services'
  import PrimeButton from 'primevue/button'

  const STATUS_PAGE = {
    none: 'operational',
    minor: 'minor-outage',
    major: 'partial-outage',
    critical: 'major-outage',
    maintenance: 'maintenance'
  }

  const STATUS_PAGE_COLORS = {
    none: '#8bc249',
    minor: '#fec111',
    major: '#f3652b',
    critical: '#ff4141',
    maintenance: '#6e7cf7'
  }

  const OPERATIONAL_STATUS = {
    indicator: 'none',
    description: 'All Systems Operational'
  }

  export default {
    name: 'SystemStatusBarBlock',
    components: {
      PrimeButton
    },
    data() {
      return {
        status: '',
        label: '',
        link: 'https://status.azion.com',
        color: STATUS_PAGE_COLORS.none
      }
    },
    created() {
      this.checkComponentStatus()
    },
    computed: {
      colorStatus() {
        return { color: this.color }
      }
    },
    methods: {
      redirectToLink() {
        window.open(this.link, '_blank')
      },
      async checkComponentStatus() {
        try {
          const { components } = await loadComponentsStatusService()

          const checkComponents = (component) =>
            component.status !== 'operational' && component.status !== 'partial_outage'
          const hasImpactedComponent = components?.some(checkComponents)

          const status = await this.getStatus(hasImpactedComponent)
          this.updateSystemStatus(status)
        } catch (error) {
          this.$toast.add({
            closable: true,
            severity: 'error',
            summary: error
          })
        }
      },
      async getStatus(checkStatusPage) {
        let status

        if (checkStatusPage) {
          status = await this.getStatusPage()
        } else {
          status = OPERATIONAL_STATUS
        }

        return status
      },
      async getStatusPage() {
        const status = await loadStatusPageService()
        return status
      },
      updateSystemStatus({ indicator, description }) {
        this.status = STATUS_PAGE[indicator]
        this.color = STATUS_PAGE_COLORS[indicator]
        this.label = description
      }
    }
  }
</script>
