<script setup>
  import { inject, onMounted, onUnmounted, ref, computed } from 'vue'
  import { useRouter } from 'vue-router'
  import PrimeButton from '@aziontech/webkit/button'
  import { usersService } from '@/services/v2/users/users-service'
  import { teamsService } from '@/services/v2/teams/teams-service'
  import { useAccountStore } from '@/stores/account'
  import InviteSession from '@/helpers/invite-session'
  import ContentBlock from '@/templates/content-block'
  import InviteUserDialog from '@/views/Home/Dialog/InviteUserDialog.vue'
  import MonthlyUsageCard from '@/templates/home-cards-block/monthly-usage-card.vue'
  import MarketplaceTrendsCard from '@/templates/home-cards-block/marketplace-trends-card.vue'
  import CommunicationsCard from '@/templates/home-cards-block/communications-card.vue'
  import ResourcesBlock from '@/templates/home-cards-block/resources-block.vue'
  import LastActivitiesBlock from '@/templates/home-cards-block/last-activities-block.vue'
  import MetricsBlock from '@/templates/home-cards-block/metrics-block.vue'
  import { useResize } from '@/composables/useResize'
  // import AzionChangelogCard from '@/templates/home-cards-block/azion-changelog-card.vue'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')
  const router = useRouter()
  const { accountData } = useAccountStore()
  const { BREAKPOINTS } = useResize()
  defineOptions({ name: 'home-view' })

  const user = accountData
  const showInviteDialog = ref(false)

  const homeSection = ref(null)
  const homeWidth = ref(0)
  let resizeObserver = null

  const homeStyle = computed(() => {
    if (!homeWidth.value || homeWidth.value > BREAKPOINTS.LG) {
      return { section: 'lg:flex-row', firstColumn: 'lg:w-[75%]', secondColumn: 'lg:w-[25%]' }
    }
    return {
      section: 'flex-col',
      firstColumn: 'w-full',
      secondColumn: 'w-full'
    }
  })

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
    if (InviteSession.sessionIsExpired()) {
      InviteSession.turnInviteBlockVisable()
    }

    if (homeSection.value) {
      resizeObserver = new ResizeObserver((entries) => {
        homeWidth.value = entries[0].contentRect.width
      })
      resizeObserver.observe(homeSection.value)
    }
  })

  onUnmounted(() => {
    resizeObserver?.disconnect()
  })
</script>

<template>
  <ContentBlock>
    <template #content>
      <section
        ref="homeSection"
        class="w-full h-full flex flex-col gap-8 pt-6 pb-8"
        :class="homeStyle.section"
      >
        <div
          class="flex flex-col w-full gap-8"
          :class="homeStyle.firstColumn"
        >
          <div class="flex w-full justify-between items-center">
            <h1 class="text-[22px] font-semibold">Welcome {{ user.name }}</h1>
            <PrimeButton
              icon="pi pi-user-plus"
              severity="secondary"
              label="Invite User"
              size="small"
              outlined
              @click="openInviteDialog"
              class="whitespace-nowrap"
            />
          </div>
          <MetricsBlock />
          <ResourcesBlock />
          <LastActivitiesBlock />
        </div>
        <div
          class="flex flex-col w-full gap-8"
          :class="homeStyle.secondColumn"
        >
          <CommunicationsCard />
          <MonthlyUsageCard @viewAll="navigateToUsage" />
          <MarketplaceTrendsCard />
          <!-- <AzionChangelogCard /> -->
        </div>
      </section>
    </template>
  </ContentBlock>

  <InviteUserDialog
    v-model:visible="showInviteDialog"
    :listTeamsService="teamsService.listTeams"
    :inviteYourTeamService="usersService.inviteTeamMember"
    @invite-success="handleInviteSuccess"
  />
</template>
