<script setup>
  import { inject, onMounted, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import PrimeButton from 'primevue/button'
  import { inviteYourTeamService } from '@/services/users-services'
  import { teamsService } from '@/services/users-services/list-teams-service'
  import { useAccountStore } from '@/stores/account'
  import InviteSession from '@/helpers/invite-session'
  import ContentBlock from '@/templates/content-block'
  import InviteUserDialog from '@/views/Home/Dialog/InviteUserDialog.vue'
  import MonthlyUsageCard from '@/templates/home-cards-block/monthly-usage-card.vue'
  import MarketplaceTrendsCard from '@/templates/home-cards-block/marketplace-trends-card.vue'
  import ResourcesBlock from '@/templates/home-cards-block/resources-block.vue'
  import LastActivitiesBlock from '@/templates/home-cards-block/last-activities-block.vue'
  import MetricsBlock from '@/templates/home-cards-block/metrics-block.vue'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')
  const router = useRouter()
  const { accountData } = useAccountStore()

  defineOptions({ name: 'home-view' })

  const user = accountData
  const teams = ref([])
  const showInviteDialog = ref(false)

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
    teams.value = await teamsService.listTeams()
    if (InviteSession.sessionIsExpired()) {
      InviteSession.turnInviteBlockVisable()
    }
  })
</script>

<template>
  <ContentBlock>
    <template #content>
      <section class="w-full h-full flex flex-col md:flex-row gap-8 pt-10 pb-8">
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
          <MarketplaceTrendsCard />
        </div>
      </section>
    </template>
  </ContentBlock>

  <InviteUserDialog
    v-model:visible="showInviteDialog"
    :listTeamsService="teamsService.listTeams"
    :inviteYourTeamService="inviteYourTeamService"
    @invite-success="handleInviteSuccess"
  />
</template>
