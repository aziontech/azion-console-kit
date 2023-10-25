<template>
  <a
    class="border flex gap-1 surface-border surface-section text-color rounded-lg text-sm px-2 align-items-center justify-center h-7"
    :href="link"
    target="_blank"
  >
    <i
      class="pi pi-circle-fill text-xs"
      :style="colorStatus"
    />
    <span class="leading-none">{{ label }}</span>
  </a>
</template>

<script>
  import {
    loadStatusPageService,
    loadComponentsStatusService
  } from '@/services/status-page-services'

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
            summary: error,
            life: 10000
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
