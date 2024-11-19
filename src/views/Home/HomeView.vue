<script setup>
  import { useAccountStore } from '@/stores/account'
  import { useCreateModalStore } from '@/stores/create-modal'
  import ContentBlock from '@/templates/content-block'
  import { computed, inject, onMounted, ref } from 'vue'
  import PrimeButton from 'primevue/button'
  import * as yup from 'yup'
  import FormFieldsHome from './FormFields/FormFieldsHome.vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useDialog } from 'primevue/usedialog'
  import { removeHtmlTagFromText } from '@/helpers'
  import DialogOnboardingScheduling from '@/templates/dialogs-block/dialog-onboarding-scheduling.vue'
  import CreateFormBlock from '@/templates/create-form-block'
  import { useLayout } from '@/composables/use-layout'

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
  const user = useAccountStore().accountData

  const teams = ref([])
  const showInviteSession = ref(props.inviteSession.show())
  const { OpenSidebarComponent } = useLayout()

  const disclaimer = computed(() => {
    return removeHtmlTagFromText(user.disclaimer, 'a')
  })

  const showExperimental = computed(() => {
    return user.disclaimer
  })

  const navigateToEdgeApplications = () => {
    router.push({ name: 'list-edge-applications' })
  }

  const navigateToPayment = () => {
    router.push({ name: 'billing' })
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
        <!-- Getting Started -->
        <div
          v-if="showExperimental"
          class="w-full p-3 surface-border border rounded-md flex flex-col gap-4 justify-between items-center sm:flex-row sm:p-8 lg:gap-10"
        >
          <p class="text-color-secondary w-full max-w-screen-lg sm:max-w-6xl">
            {{ disclaimer }}
          </p>
          <PrimeButton
            type="button"
            label="Add payment method"
            outlined
            class="w-full sm:min-w-[10rem] sm:max-w-[10rem]"
            size="small"
            @click="navigateToPayment"
          />
        </div>
        <div
          class="w-full p-3 sm:p-8 surface-border border rounded-md flex flex-col gap-6 lg:gap-10 justify-between"
        >
          <div class="flex flex-col gap-4 max-w-4xl">
            <h1 class="text-color text-2xl md:text-3xl font-medium">Get Started</h1>
            <h2 class="text-sm md:text-xl text-color-secondary font-normal">
              Welcome aboard! Feel free to explore or get a head start below.
            </h2>
          </div>
          <div>
            <PrimeButton
              icon="pi pi-plus"
              class="w-full sm:w-auto"
              label="Create"
              type="button"
              size="small"
              @click="openModalCreate"
            />
          </div>
        </div>

        <div class="flex flex-col xl:flex-row gap-6">
          <!-- Manage Applications -->
          <div class="w-full p-3 sm:p-6 flex flex-col gap-6 surface-border border rounded-md">
            <div class="flex flex-row justify-start gap-3">
              <div
                class="w-11 h-11 flex flex-shrink-0 justify-center items-center rounded-md surface-200"
              >
                <span class="ai ai-edge-application"></span>
              </div>
              <div class="flex flex-col gap-2">
                <div class="text-lg sm:text-xl font-medium">Manage Edge Applications</div>
                <div class="text-xs sm:text-sm text-color-secondary">
                  Add and manage edge applications' main settings, modules, and features.
                </div>
              </div>
            </div>
            <div class="flex flex-col items-start sm:flex-row gap-3 sm:gap-4">
              <PrimeButton
                type="button"
                label="Manage Applications"
                outlined
                class="w-full sm:w-auto"
                size="small"
                @click="navigateToEdgeApplications"
              />
              <PrimeButton
                type="button"
                label="How to build an application"
                link
                class="w-full sm:w-auto"
                icon="pi pi-external-link"
                iconPos="right"
                size="small"
                @click="openDocsEdgeApplication"
                :pt="{
                  root: { class: 'justify-center' },
                  label: { class: 'grow-0' }
                }"
              />
            </div>
          </div>
          <!-- View Analytics -->
          <div class="w-full p-3 sm:p-6 flex flex-col gap-6 surface-border border rounded-md">
            <div class="flex flex-row justify-start gap-3">
              <div
                class="w-11 h-11 flex flex-shrink-0 justify-center items-center rounded-md surface-200"
              >
                <span class="ai ai-real-time-metrics"></span>
              </div>
              <div class="flex flex-col gap-2">
                <div class="text-lg sm:text-xl font-medium">View Analytics</div>
                <div class="text-xs sm:text-sm text-color-secondary">
                  Get powerful insights into applications performance, availability, and security.
                </div>
              </div>
            </div>
            <div class="flex flex-col items-start sm:flex-row gap-3 sm:gap-4">
              <PrimeButton
                type="button"
                class="sm:w-auto w-full"
                label="View Real-Time Metrics"
                outlined
                size="small"
                @click="navigateToRealTimeMetrics"
              />
              <PrimeButton
                type="button"
                label="How to use Real-Time Metrics"
                link
                class="w-full sm:w-auto"
                icon="pi pi-external-link"
                iconPos="right"
                size="small"
                @click="openDocsRealTimeMetrics"
                :pt="{
                  root: { class: 'justify-center' },
                  label: { class: 'grow-0' }
                }"
              />
            </div>
          </div>

          <div class="w-full p-3 sm:p-6 flex flex-col gap-6 surface-border border rounded-md">
            <div class="flex flex-row justify-start gap-3">
              <div
                class="w-11 h-11 flex flex-shrink-0 justify-center items-center rounded-md surface-200"
              >
                <span class="ai ai-ask-azion"></span>
              </div>
              <div class="flex flex-col gap-2">
                <div class="text-lg sm:text-xl font-medium">Ask Azion Copilot</div>
                <div class="text-xs sm:text-sm text-color-secondary">
                  Ask your questions to Azion Copilot, Azion's artificial intelligence trained with
                  years of edge computing expertise.
                </div>
              </div>
            </div>
            <div class="flex flex-col items-start sm:flex-row gap-3 sm:gap-4">
              <PrimeButton
                type="button"
                class="sm:w-auto w-full"
                label="Go to Azion Copilot"
                outlined
                size="small"
                @click="OpenSidebarComponent('copilot')"
              />
            </div>
          </div>
        </div>

        <div
          class="w-full p-3 sm:p-6 surface-border border rounded-md flex flex-col gap-6 justify-between relative"
          v-if="showInviteSession"
        >
          <PrimeButton
            icon="pi pi-times"
            outlined
            class="absolute right-3 top-3 sm:right-6 sm:top-6"
            size="small"
            type="button"
            @click="closeInviteSession"
          />
          <div class="flex flex-col gap-2">
            <div class="text-lg sm:text-xl font-medium">Invite your Team</div>
            <div class="text-xs sm:text-sm text-color-secondary">
              All Azion plans include unlimited team seats. Invite colleagues to start building
              together.
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

        <div class="flex flex-col xl:flex-row gap-6">
          <!-- Product -->
          <button
            type="button"
            class="sm:h-auto lg:h-40 hover:border-primary w-full p-3 sm:p-6 text-start flex flex-col gap-2 surface-border border rounded-md"
            @click="openProductDocumentation"
          >
            <div class="text-lg font-medium">Product Documentation</div>
            <div class="text-sm text-color-secondary">
              Understand how to configure all Azion products and their features.
            </div>
          </button>
          <!-- API -->
          <button
            type="button"
            class="sm:h-auto lg:h-40 hover:border-primary w-full p-3 sm:p-6 text-start flex flex-col gap-2 surface-border border rounded-md"
            @click="openAPIDocumentation"
          >
            <div class="text-lg font-medium">API Documentation</div>
            <div class="text-sm text-color-secondary">
              Use the Azion API to interact with Azion products through HTTPS requests.
            </div>
          </button>
          <!-- Contact -->
          <button
            type="button"
            class="sm:h-auto lg:h-40 hover:border-primary w-full p-3 sm:p-6 text-start flex flex-col gap-2 surface-border border rounded-md"
            @click="OpenSidebarComponent('copilot', { clearChat: true })"
          >
            <div class="text-lg font-medium">Get Assistance (Support)</div>
            <div class="text-sm text-color-secondary">
              Access personalized assistance for your queries, suggestions, or incident reports
            </div>
          </button>
        </div>
      </section>
    </template>
  </ContentBlock>
</template>
