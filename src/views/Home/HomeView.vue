<script setup>
  import { inject, onMounted, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import PrimeButton from 'primevue/button'
  import { useAccountStore } from '@/stores/account'
  import ContentBlock from '@/templates/content-block'
  import InviteUserDialog from './Dialog/InviteUserDialog.vue'

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
  const currentMarketplaceIndex = ref(0)
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

  const nextMarketplaceItem = () => {
    currentMarketplaceIndex.value =
      (currentMarketplaceIndex.value + 1) % marketplaceItems.value.length
  }

  const previousMarketplaceItem = () => {
    currentMarketplaceIndex.value =
      currentMarketplaceIndex.value === 0
        ? marketplaceItems.value.length - 1
        : currentMarketplaceIndex.value - 1
  }

  const goToMarketplaceItem = (index) => {
    currentMarketplaceIndex.value = index
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
          <!-- Monthly Usage Mock-->
          <div
            class="border border-[var(--surface-border)] rounded-md bg-[var(--surface-section)] flex flex-col overflow-hidden"
          >
            <div
              class="bg-[var(--surface-50)] border-b border-[var(--surface-border)] px-4 py-1.5 h-11 flex items-center"
            >
              <h2 class="text-base font-semibold text-white">Monthly Usage</h2>
            </div>

            <div class="p-4 flex flex-col gap-2.5">
              <div
                v-for="(item, index) in monthlyUsageData"
                :key="index"
                class="flex items-start justify-between text-xs"
              >
                <span class="text-[var(--text-color-secondary)]">{{ item.label }}</span>
                <span class="text-[var(--text-color)]">{{ item.value }}</span>
              </div>
            </div>

            <div
              class="border-t border-[var(--surface-border)] h-11 flex items-center justify-center px-4 cursor-pointer hover:bg-[var(--surface-hover)]"
              @click="navigateToUsage"
            >
              <span class="text-xs text-[var(--text-color-link)] text-center">
                View all Usage...
              </span>
            </div>
          </div>
          <!-- Start Marketplace Trends Block -->
          <div
            class="border border-[var(--surface-border)] rounded-md bg-[var(--surface-section)] flex flex-col overflow-hidden"
          >
            <div
              class="bg-[var(--surface-50)] border-b border-[var(--surface-border)] px-4 py-1.5 h-11 flex items-center"
            >
              <h2 class="text-base font-semibold text-white">Marketplace Trends</h2>
            </div>

            <div class="bg-[var(--surface-100)] flex gap-2.5 h-[138px] items-center px-4 py-3">
              <div class="flex-1 flex flex-col gap-3">
                <div class="flex flex-col gap-2 w-full">
                  <div class="flex gap-2.5 items-center w-full">
                    <div class="rounded-md size-6 overflow-hidden flex-shrink-0">
                      <i class="pi pi-box text-[var(--text-color-base)]"></i>
                    </div>
                    <div class="flex-1 flex flex-col gap-0 justify-center">
                      <h3
                        class="text-sm font-semibold text-[var(--text-color-base)] overflow-hidden text-ellipsis whitespace-nowrap"
                      >
                        {{ marketplaceItems[currentMarketplaceIndex].name }}
                      </h3>
                    </div>
                  </div>

                  <p
                    class="text-xs text-[var(--text-color-muted)] leading-[1.5] overflow-hidden max-h-[53px] min-h-[24px]"
                    style="
                      display: -webkit-box;
                      -webkit-line-clamp: 3;
                      -webkit-box-orient: vertical;
                      line-clamp: 3;
                    "
                  >
                    {{ marketplaceItems[currentMarketplaceIndex].description }}
                  </p>
                </div>

                <div class="flex gap-2.5 items-center text-[10px] leading-[1.3]">
                  <div class="flex gap-1 items-center">
                    <span class="text-[var(--text-color-base)]">By</span>
                    <span class="font-semibold text-[var(--text-color-muted)]">
                      {{ marketplaceItems[currentMarketplaceIndex].author }}
                    </span>
                  </div>
                  <div class="flex gap-1 items-center">
                    <span class="text-[var(--text-color-base)]">Version</span>
                    <span class="text-[var(--text-color-muted)]">
                      {{ marketplaceItems[currentMarketplaceIndex].version }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div
              class="border-t border-[var(--surface-border)] h-11 flex gap-4 items-center justify-center px-4 py-2"
            >
              <PrimeButton
                icon="pi pi-chevron-left"
                text
                rounded
                size="small"
                :disabled="currentMarketplaceIndex === 0"
                @click="previousMarketplaceItem"
                class="w-8 h-8"
                :class="{ 'opacity-60': currentMarketplaceIndex === 0 }"
              />

              <div class="flex gap-1.5 h-full items-center justify-center">
                <button
                  v-for="(item, index) in marketplaceItems"
                  :key="index"
                  @click="goToMarketplaceItem(index)"
                  class="w-2 h-2 rounded-full transition-opacity"
                  :class="
                    currentMarketplaceIndex === index
                      ? 'bg-white opacity-100'
                      : 'bg-white opacity-16'
                  "
                />
              </div>

              <PrimeButton
                icon="pi pi-chevron-right"
                text
                rounded
                size="small"
                @click="nextMarketplaceItem"
                class="w-8 h-8"
              />
            </div>
          </div>
          <!-- Start Azion Changelog Block -->
          <div
            class="border border-[var(--surface-border)] rounded-md bg-[var(--surface-section)] flex flex-col overflow-hidden"
          >
            <div
              class="bg-[var(--surface-50)] border-b border-[var(--surface-border)] px-4 py-1.5 h-11 flex items-center"
            >
              <h2 class="text-base font-semibold text-white">Azion Changelog</h2>
            </div>

            <div class="p-4">
              <div class="flex items-center w-[273px]">
                <div class="flex flex-col items-start w-full">
                  <div
                    v-for="(item, index) in changelogItems"
                    :key="index"
                    class="flex items-start min-h-[70px] w-full"
                  >
                    <div class="flex flex-col items-center self-stretch">
                      <div
                        class="bg-[#18181b] border-2 border-[#3f3f46] flex items-center justify-center p-0.5 rounded-[7.875px] size-[15.75px]"
                      >
                        <div
                          class="bg-[#18181b] flex-1 h-full rounded-[7.875px] flex items-center justify-center"
                          style="
                            box-shadow:
                              0px 0.5px 0px 0px rgba(0, 0, 0, 0.06),
                              0px 1px 1px 0px rgba(0, 0, 0, 0.12);
                          "
                        >
                          <div class="bg-[#fe601f] rounded-[2.625px] size-[5.25px]"></div>
                        </div>
                      </div>

                      <div
                        v-if="index < changelogItems.length - 1"
                        class="bg-[#3f3f46] flex-1 w-0.5"
                      ></div>
                    </div>

                    <div class="flex-1 flex flex-col px-3.5">
                      <div class="flex flex-col gap-1 rounded-md w-full">
                        <p class="text-[10px] text-[#a1a1aa] leading-normal">
                          {{ item.time }}
                        </p>
                        <p class="text-xs text-white leading-[1.5]">
                          {{ item.description }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              class="border-t border-[var(--surface-border)] h-11 flex items-center justify-center px-4 cursor-pointer hover:bg-[var(--surface-hover)]"
            >
              <span class="text-xs text-[var(--text-color-link)] text-center">
                View all Changelog...
              </span>
            </div>
          </div>
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
