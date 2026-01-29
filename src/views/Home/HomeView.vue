<script setup>
  import { inject, onMounted, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import PrimeButton from 'primevue/button'
  import { useAccountStore } from '@/stores/account'
  import ContentBlock from '@/templates/content-block'
  import InviteUserDialog from '@/views/Home/Dialog/InviteUserDialog.vue'
  import MonthlyUsageCard from '@/templates/home-cards-block/monthly-usage-card.vue'
  import MarketplaceTrendsCard from '@/templates/home-cards-block/marketplace-trends-card.vue'
  import AzionChangelogCard from '@/templates/home-cards-block/azion-changelog-card.vue'
  import ResourcesBlock from '@/templates/home-cards-block/resources-block.vue'
  import LastActivitiesBlock from '@/templates/home-cards-block/last-activities-block.vue'
  import MetricsBlock from '@/templates/home-cards-block/metrics-block.vue'

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
        <div class="flex flex-col w-full md:w-[75%] gap-8">
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
          <MetricsBlock />
          <ResourcesBlock />
          <LastActivitiesBlock />
        </div>

        <div class="flex flex-col w-full md:w-[30%] gap-8">
          <MonthlyUsageCard @viewAll="navigateToUsage" />
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
