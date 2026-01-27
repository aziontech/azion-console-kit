<script setup>
  import { inject, onMounted, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import PrimeButton from 'primevue/button'
  import { useAccountStore } from '@/stores/account'
  import ContentBlock from '@/templates/content-block'
  import InviteUserDialog from './Dialog/InviteUserDialog.vue'
  import MonthlyUsageCard from '@/templates/home-cards-block/monthly-usage-card.vue'
  import MarketplaceTrendsCard from '@/templates/home-cards-block/marketplace-trends-card.vue'
  import AzionChangelogCard from '@/templates/home-cards-block/azion-changelog-card.vue'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')
  const router = useRouter()
  const { accountData } = useAccountStore()

  defineOptions({ name: 'home-view' })

  const props = defineProps({
    listTeamsService: {
      type: Function,
      required: true
    },
    inviteYourTeamService: {
      type: Function,
      required: true
    },
    inviteSession: {
      type: Function,
      required: true
    },
    windowManager: {
      type: Object,
      required: true
    }
  })

  const user = accountData
  const teams = ref([])
  const showInviteDialog = ref(false)
  const metricsData = ref([
    {
      label: 'Total Data Transfered',
      value: '218.8',
      unit: 'MB',
      trend: {
        direction: 'up',
        percentage: '6.62%'
      }
    },
    {
      label: 'Requests',
      value: '6.6',
      unit: '/ s',
      trend: {
        direction: 'down',
        percentage: '6.62%'
      }
    },
    {
      label: 'Bandwidth Saving',
      value: '20.8',
      unit: 'MB',
      trend: {
        direction: 'up',
        percentage: '6.62%'
      }
    },
    {
      label: 'Data Transf. Offload',
      value: '49',
      unit: '%',
      trend: {
        direction: 'up',
        percentage: '86.62%'
      }
    }
  ])
  const marketplaceItems = ref([
    {
      name: 'CardStream',
      description:
        "Global list of cards leaked on the internet, deep and dark web. That's how you are able to protect your e-commerce from fraud even on the first purchase and, consequently, avoid the chargeback.",
      author: 'Axur',
      version: '2.1.0'
    },
    {
      name: 'Security Shield',
      description:
        'Advanced security solution to protect your applications from DDoS attacks and malicious traffic with real-time monitoring and automated responses.',
      author: 'SecureNet',
      version: '1.5.2'
    },
    {
      name: 'Analytics Pro',
      description:
        'Comprehensive analytics platform providing deep insights into your application performance, user behavior, and business metrics with customizable dashboards.',
      author: 'DataViz',
      version: '3.0.1'
    }
  ])
  const changelogItems = ref([
    {
      time: '12 hours ago',
      description: 'Released a new interface for Object Storage in Preview.'
    },
    {
      time: '3 days ago',
      description: 'New success toast pattern for created resources.'
    },
    {
      time: '4 days ago',
      description: 'Many products and services are been renamed for market pattern.'
    },
    {
      time: '4 days ago',
      description: 'Many products and services are been renamed for market pattern.'
    }
  ])
  const monthlyUsageData = ref([
    {
      label: 'Edge DNS Hosted Zones',
      value: '13'
    },
    {
      label: 'Object Storage Data Stored',
      value: '26.642 GB'
    },
    {
      label: 'Workloads Total Data Transfered',
      value: '22.416 GB'
    },
    {
      label: 'Workloads Total Requests',
      value: '5123'
    }
  ])

  const navigateToUsage = () => {
    router.push({ name: 'billing-tabs' })
  }

  const openInviteDialog = () => {
    tracker.create.createEventInHomeAndHeader({ url: '/', location: 'home' }).track()
    showInviteDialog.value = true
  }

  const handleInviteSuccess = () => {
    showInviteDialog.value = false
  }

  onMounted(async () => {
    teams.value = await props.listTeamsService()
    if (props.inviteSession.sessionIsExpired()) {
      props.inviteSession.turnInviteBlockVisable()
    }
  })
</script>

<template>
  <ContentBlock>
    <template #content>
      <section class="w-full h-full flex flex-col md:flex-row gap-8 pt-10 px-8 pb-8">
        <div class="flex flex-col w-full md:w-[70%] gap-8">
          <div class="flex w-full justify-between items-center">
            <h1 class="text-[22px]">Welcome {{ user.name }}</h1>
            <PrimeButton
              icon="pi pi-user-plus"
              severity="secondary"
              label="Invite User"
              outlined
              @click="openInviteDialog"
            />
          </div>
          <!-- Start Metrics Block -->
          <div class="flex flex-col gap-3 w-full">
            <div class="flex gap-3 items-center h-7">
              <span class="text-base font-semibold">Metrics</span>
              <PrimeButton
                icon="ai ai-filter"
                size="small"
                severity="secondary"
                text
              />
            </div>
            <div class="flex flex-col gap-2 w-full relative">
              <div
                class="border border-[var(--surface-border)] rounded-md overflow-hidden flex w-full"
              >
                <div
                  v-for="(metric, index) in metricsData"
                  :key="index"
                  class="bg-[var(--surface-section)] flex-1 h-[101px] p-5 flex flex-col gap-2.5"
                  :class="{ 'border-l border-[var(--surface-border)]': index > 0 }"
                >
                  <div class="flex items-center justify-between w-full">
                    <div class="flex flex-1 gap-2 items-center">
                      <span
                        class="text-[10px] uppercase tracking-wider text-[var(--text-color-secondary)] font-medium"
                        style="font-family: 'Proto Mono', monospace"
                      >
                        {{ metric.label }}
                      </span>
                      <div class="bg-[var(--surface-input)] p-1 rounded-full flex items-center">
                        <i class="pi pi-info-circle text-[7px]"></i>
                      </div>
                    </div>
                  </div>

                  <div class="flex gap-2 items-center w-full">
                    <div class="flex gap-1 items-center">
                      <span class="text-[28px] font-semibold tracking-tight text-[#ededed]">
                        {{ metric.value }}
                      </span>
                      <span class="text-xs text-[#ededed]">{{ metric.unit }}</span>
                    </div>

                    <div
                      class="flex gap-2 items-center px-2 py-1 rounded-md"
                      :class="
                        metric.trend.direction === 'up'
                          ? 'bg-[rgba(22,163,74,0.2)]'
                          : 'bg-[rgba(245,61,61,0.2)]'
                      "
                    >
                      <i
                        class="text-[10.5px]"
                        :class="
                          metric.trend.direction === 'up'
                            ? 'pi pi-arrow-circle-up text-[#39e478]'
                            : 'pi pi-arrow-circle-down text-[#f53d3d]'
                        "
                      ></i>
                      <span
                        class="text-[11px] font-semibold leading-4"
                        :class="
                          metric.trend.direction === 'up' ? 'text-[#39e478]' : 'text-[#f53d3d]'
                        "
                      >
                        {{ metric.trend.percentage }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <!-- Start Resources Block -->
          <div class="flex flex-col gap-3 w-full">
            <div class="flex gap-3">
              <span class="text-[16px]">Resources</span>
              <i class="pi pi-filter"></i>
            </div>
            <div
              class="h-[308px] w-full border rounded border-[var(--surface-border)] bg-[var(--surface-section)]"
            ></div>
          </div>
          <!-- Start Last Activities Block -->
          <div class="flex flex-col gap-3 w-full">
            <div class="flex gap-3">
              <span class="text-[16px]">Last Activities</span>
              <i class="pi pi-filter"></i>
            </div>
            <div
              class="h-[308px] w-full border rounded border-[var(--surface-border)] bg-[var(--surface-section)]"
            ></div>
          </div>
        </div>

        <div class="flex flex-col w-full md:w-[30%] gap-8">
          <MonthlyUsageCard
            :usageData="monthlyUsageData"
            @viewAll="navigateToUsage"
          />
          <MarketplaceTrendsCard :items="marketplaceItems" />
          <AzionChangelogCard :changelogItems="changelogItems" />
        </div>
      </section>
    </template>
  </ContentBlock>

  <InviteUserDialog
    v-model:visible="showInviteDialog"
    :listTeamsService="props.listTeamsService"
    :inviteYourTeamService="props.inviteYourTeamService"
    @invite-success="handleInviteSuccess"
  />
</template>
