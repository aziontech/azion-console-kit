<script setup>
  import { useAccountStore } from '@/stores/account'
  import { useCreateModalStore } from '@/stores/create-modal'
  import ContentBlock from '@/templates/content-block'
  import { computed, inject, onMounted, ref, watch } from 'vue'
  import PrimeButton from 'primevue/button'
  import PrimeSkeleton from 'primevue/skeleton'
  import * as yup from 'yup'
  import FormFieldsHome from './FormFields/FormFieldsHome.vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useDialog } from 'primevue/usedialog'
  import { removeHtmlTagFromText } from '@/helpers'
  import DialogOnboardingScheduling from '@/templates/dialogs-block/dialog-onboarding-scheduling.vue'
  import CreateFormBlock from '@/templates/create-form-block'
  import { useLayout } from '@/composables/use-layout'
  import { storeToRefs } from 'pinia'
  import { solutionService } from '@/services/v2/marketplace/solution-service'
  import { hasFlagBlockApiV4 } from '@/composables/user-flag'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

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

  const router = useRouter()
  const route = useRoute()
  const dialog = useDialog()
  const accountStore = useAccountStore()
  const { accountData } = storeToRefs(accountStore)

  const teams = ref([])
  const showInviteSession = ref(props.inviteSession.show())
  const { isSidebarActive, isVisibleMobileSidebar, OpenSidebarComponent } = useLayout()

  const showSidebar = computed(() => isSidebarActive.value && isVisibleMobileSidebar.value)
  const disclaimer = computed(() => {
    return removeHtmlTagFromText(accountData.value?.disclaimer, 'a')
  })

  const showExperimental = computed(() => {
    return !!accountData.value?.disclaimer
  })

  const userFirstName = computed(() => {
    const [firstName] = (accountData.value?.name || '').split(' ')
    return firstName || null
  })

  const recommendedQuery = ref(null)
  const lastRecommendedKey = ref('')

  const recommendedSolutions = computed(() => recommendedQuery.value?.data || [])
  const recommendedIsLoading = computed(() => recommendedQuery.value?.isLoading || false)
  const hasRecommendedSolutions = computed(() => recommendedSolutions.value.length > 0)

  watch(
    () => [accountData.value?.kind, accountData.value?.jobRole],
    ([kind, jobRole]) => {
      if (kind !== 'client' || !jobRole) {
        recommendedQuery.value = null
        lastRecommendedKey.value = ''
        return
      }

      const type = hasFlagBlockApiV4() ? jobRole : `${jobRole}-v4`
      const queryKey = `${kind}:${type}`

      if (queryKey === lastRecommendedKey.value && recommendedQuery.value) return

      lastRecommendedKey.value = queryKey
      recommendedQuery.value = solutionService.useListSolutions({
        group: 'recommended',
        type
      })
    },
    { immediate: true }
  )

  const navigateToEdgeApplications = () => {
    router.push({ name: 'list-edge-applications' })
  }

  const navigateToMarketplace = () => {
    router.push({ name: 'marketplace-home' })
  }

  const navigateToPayment = () => {
    router.push({ name: 'billing-tabs' })
  }

  const navigateToRealTimeMetrics = () => {
    router.push({ name: 'real-time-metrics' })
  }

  const openDocsEdgeApplication = () => {
    props.windowManager.documentationGuideProducts.edgeApplication()
  }

  const openDocsRealTimeMetrics = () => {
    props.windowManager.documentationGuideProducts.realTimeMetrics()
  }

  const openProductDocumentation = () => {
    props.windowManager.openDocumentation()
  }

  const openAPIDocumentation = () => {
    props.windowManager.openAPIDocumentation()
  }

  const openContactSupport = () => {
    props.windowManager.openContactSupport()
  }

  const validationSchema = yup.object({
    name: yup
      .string()
      .required('Full Name is a required field')
      .test('non-numeric', 'Full Name must include first and last name', (value) => {
        const alphaRegex = /[A-zÀ-ž.'-]+ [A-zÀ-ž.'-]+/
        return alphaRegex.test(value)
      }),
    email: yup.string().email('Must be a valid email').required('E-mail is a required field'),
    team: yup.string().required()
  })

  const closeInviteSession = () => {
    props.inviteSession.closeInviteBlock()
    showInviteSession.value = false
  }

  const createModalStore = useCreateModalStore()

  const openModalCreate = () => {
    tracker.create.createEventInHomeAndHeader({ url: '/', location: 'home' }).track()
    createModalStore.toggle()
  }

  const launchRecommendedSolution = (solution) => {
    tracker.create.selectedOnCreate({
      section: 'home-recommended',
      selection: solution.name
    })

    router.push({
      name: 'create-something-new',
      params: {
        vendor: solution.vendor.slug,
        solution: solution.slug
      }
    })
  }

  const showOnboardingSchedulingDialog = () => {
    if (route.query.onboardingSession) {
      dialog.open(DialogOnboardingScheduling)
    }
  }

  onMounted(async () => {
    teams.value = await props.listTeamsService()
    showOnboardingSchedulingDialog()
    if (props.inviteSession.sessionIsExpired()) {
      props.inviteSession.turnInviteBlockVisable()
    }
  })
</script>

<template>
  <ContentBlock>
    <template #content>
      <section class="w-full flex flex-col gap-6 lg:gap-8">
        <div
          v-if="showExperimental"
          class="w-full p-4 sm:p-6 surface-border border rounded-2xl flex flex-col gap-4 justify-between items-center sm:flex-row"
        >
          <p class="text-color-secondary w-full max-w-screen-lg sm:max-w-6xl">
            {{ disclaimer }}
          </p>
          <PrimeButton
            type="button"
            label="Add payment method"
            outlined
            class="w-full sm:min-w-[10rem] sm:max-w-[12rem]"
            size="small"
            @click="navigateToPayment"
          />
        </div>

        <div
          class="relative overflow-hidden border surface-border rounded-2xl p-6 sm:p-10 flex flex-col gap-8 surface-card"
        >
          <div class="flex flex-col gap-4 max-w-3xl">
            <span
              v-if="userFirstName"
              class="text-xs uppercase tracking-[0.3em] text-primary"
            >
              Welcome back, {{ userFirstName }}
            </span>
            <h1 class="text-color text-3xl md:text-5xl font-semibold leading-tight">
              Build on Azion's Edge Platform
            </h1>
            <p class="text-sm md:text-lg text-color-secondary">
              Launch production-ready solutions recommended for your workload and manage every edge
              experience from a single place.
            </p>
            <div class="flex flex-col sm:flex-row gap-3">
              <PrimeButton
                icon="pi pi-plus"
                class="w-full sm:w-auto"
                label="Create solution"
                type="button"
                size="small"
                @click="openModalCreate"
              />
              <PrimeButton
                icon="pi pi-compass"
                class="w-full sm:w-auto"
                label="Explore Marketplace"
                type="button"
                size="small"
                outlined
                @click="navigateToMarketplace"
              />
            </div>
          </div>
          <div class="pointer-events-none absolute -top-24 right-8 h-64 w-64 rounded-full bg-primary opacity-20 blur-3xl"></div>
          <div class="pointer-events-none absolute -bottom-32 -right-24 h-64 w-64 rounded-full bg-surface-200 opacity-60 blur-3xl dark:bg-surface-700 dark:opacity-40"></div>
        </div>

        <div class="border surface-border rounded-2xl p-6 sm:p-8 flex flex-col gap-6">
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex flex-col gap-2">
              <h2 class="text-xl font-medium">Recommended for you</h2>
              <p class="text-sm text-color-secondary">
                Curated solutions to start faster based on your role and platform usage.
              </p>
            </div>
            <PrimeButton
              type="button"
              label="Browse all solutions"
              icon="pi pi-arrow-right"
              iconPos="right"
              link
              class="justify-start sm:justify-end"
              @click="navigateToMarketplace"
              :pt="{ root: { class: 'justify-start sm:justify-end' }, label: { class: 'grow-0' } }"
            />
          </div>

          <div v-if="recommendedIsLoading" class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div
              v-for="index in 3"
              :key="`recommended-skeleton-${index}`"
              class="border surface-border rounded-xl p-5 flex flex-col gap-3"
            >
              <PrimeSkeleton width="70%" height="1.75rem" />
              <PrimeSkeleton width="90%" height="1rem" />
              <PrimeSkeleton width="40%" height="1rem" />
            </div>
          </div>

          <div
            v-else-if="hasRecommendedSolutions"
            class="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
          >
            <button
              v-for="solution in recommendedSolutions"
              :key="solution.id"
              type="button"
              class="group border surface-border rounded-xl p-5 text-start transition hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              @click="launchRecommendedSolution(solution)"
            >
              <div class="flex items-start justify-between gap-2">
                <span class="text-xs font-semibold uppercase tracking-wide text-primary">
                  {{ solution.category || 'Solution' }}
                </span>
                <span
                  class="pi pi-arrow-up-right text-sm text-color-secondary transition group-hover:text-primary"
                ></span>
              </div>
              <div class="mt-3 text-lg font-medium text-color">
                {{ solution.name }}
              </div>
              <p class="mt-2 text-sm text-color-secondary min-h-[3.5rem]">
                {{ solution.headline || 'Launch this solution to get started instantly.' }}
              </p>
            </button>
          </div>

          <div v-else class="rounded-xl border border-dashed surface-border p-6 text-sm text-color-secondary">
            We are preparing recommendations for you. Explore the Marketplace to discover templates and
            integrations tailored to your projects.
          </div>
        </div>

        <div class="grid gap-6 xl:grid-cols-3" :class="{ 'xl:grid-cols-2': showSidebar }">
          <div class="rounded-2xl border surface-border p-6 flex flex-col gap-4">
            <div class="flex items-start gap-3">
              <div class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl surface-200">
                <span class="ai ai-edge-application text-xl"></span>
              </div>
              <div class="flex flex-col gap-1">
                <h3 class="text-lg font-medium">Manage Applications</h3>
                <p class="text-sm text-color-secondary">
                  Control application settings, modules, and delivery pipelines from a single workspace.
                </p>
              </div>
            </div>
            <div class="flex flex-col sm:flex-row gap-3">
              <PrimeButton
                type="button"
                label="Open applications"
                outlined
                class="w-full sm:w-auto"
                size="small"
                @click="navigateToEdgeApplications"
              />
              <PrimeButton
                type="button"
                label="Docs"
                link
                class="w-full sm:w-auto"
                icon="pi pi-external-link"
                iconPos="right"
                size="small"
                @click="openDocsEdgeApplication"
                :pt="{ root: { class: 'justify-center' }, label: { class: 'grow-0' } }"
              />
            </div>
          </div>

          <div class="rounded-2xl border surface-border p-6 flex flex-col gap-4">
            <div class="flex items-start gap-3">
              <div class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl surface-200">
                <span class="ai ai-real-time-metrics text-xl"></span>
              </div>
              <div class="flex flex-col gap-1">
                <h3 class="text-lg font-medium">Observe in Real Time</h3>
                <p class="text-sm text-color-secondary">
                  Monitor performance, availability, and security insights across every edge region.
                </p>
              </div>
            </div>
            <div class="flex flex-col sm:flex-row gap-3">
              <PrimeButton
                type="button"
                class="w-full sm:w-auto"
                label="View metrics"
                outlined
                size="small"
                @click="navigateToRealTimeMetrics"
              />
              <PrimeButton
                type="button"
                label="How to use"
                link
                class="w-full sm:w-auto"
                icon="pi pi-external-link"
                iconPos="right"
                size="small"
                @click="openDocsRealTimeMetrics"
                :pt="{ root: { class: 'justify-center' }, label: { class: 'grow-0' } }"
              />
            </div>
          </div>

          <div class="rounded-2xl border surface-border p-6 flex flex-col gap-4">
            <div class="flex items-start gap-3">
              <div class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl surface-200">
                <span class="ai ai-ask-azion text-xl"></span>
              </div>
              <div class="flex flex-col gap-1">
                <h3 class="text-lg font-medium">Ask Azion Copilot</h3>
                <p class="text-sm text-color-secondary">
                  Use our AI assistant to plan architectures, configure products, and troubleshoot
                  issues.
                </p>
              </div>
            </div>
            <div class="flex flex-col sm:flex-row gap-3">
              <PrimeButton
                type="button"
                class="w-full sm:w-auto"
                label="Open Copilot"
                outlined
                size="small"
                @click="OpenSidebarComponent('copilot')"
              />
              <PrimeButton
                type="button"
                class="w-full sm:w-auto"
                label="Contact support"
                text
                size="small"
                @click="openContactSupport"
              />
            </div>
          </div>
        </div>

        <div class="grid gap-6 xl:grid-cols-3">
          <button
            type="button"
            class="hover:border-primary w-full p-6 text-start flex flex-col gap-2 surface-border border rounded-2xl transition"
            @click="openProductDocumentation"
          >
            <div class="text-lg font-medium">Product Documentation</div>
            <div class="text-sm text-color-secondary">
              Configure Azion products step by step with detailed guides and tutorials.
            </div>
          </button>
          <button
            type="button"
            class="hover:border-primary w-full p-6 text-start flex flex-col gap-2 surface-border border rounded-2xl transition"
            @click="openAPIDocumentation"
          >
            <div class="text-lg font-medium">API Reference</div>
            <div class="text-sm text-color-secondary">
              Automate workflows with our REST APIs and integrate Azion into your pipelines.
            </div>
          </button>
          <button
            type="button"
            class="hover:border-primary w-full p-6 text-start flex flex-col gap-2 surface-border border rounded-2xl transition"
            @click="OpenSidebarComponent('copilot', { clearChat: true })"
          >
            <div class="text-lg font-medium">Get Assistance</div>
            <div class="text-sm text-color-secondary">
              Reach our team for personalized guidance, incident reports, or account questions.
            </div>
          </button>
        </div>

        <div
          class="w-full p-6 sm:p-8 surface-border border rounded-2xl flex flex-col gap-6 justify-between relative"
          v-if="showInviteSession"
        >
          <PrimeButton
            icon="pi pi-times"
            outlined
            class="absolute right-6 top-6"
            size="small"
            type="button"
            aria-label="Close invite session"
            @click="closeInviteSession"
          />
          <div class="flex flex-col gap-2">
            <div class="text-lg sm:text-xl font-medium">Invite your team</div>
            <div class="text-sm text-color-secondary">
              All Azion plans include unlimited team seats. Invite colleagues to start building together.
            </div>
          </div>
          <CreateFormBlock
            :createService="props.inviteYourTeamService"
            :schema="validationSchema"
            disabledCallback
            class="flex flex-col lg:flex-row justify-between gap-3 sm:gap-6"
            :unSaved="false"
          >
            <template #form>
              <FormFieldsHome :teams="teams"></FormFieldsHome>
            </template>
            <template #action-bar="{ onSubmit, loading }">
              <div class="mt-auto lg:mt-7">
                <PrimeButton
                  severity="secondary"
                  type="submit"
                  label="Invite"
                  size="small"
                  @click="onSubmit"
                  :loading="loading"
                  :disabled="loading"
                  class="w-full px-4 lg:w-auto"
                />
              </div>
            </template>
          </CreateFormBlock>
        </div>
      </section>
    </template>
  </ContentBlock>
</template>
