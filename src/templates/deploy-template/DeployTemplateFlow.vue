<script setup>
  /**
   * DeployTemplateFlow.vue
   *
   * Orchestrator component for the multi-step deploy template flow.
   * Manages state for the current step and coordinates scroll-based transitions.
   *
   * Uses simple vertical scroll:
   * - Cards exist in the DOM simultaneously (stacked vertically)
   * - On "Next" click, smooth scrolls to reveal next step
   * - Previous cards remain visible during and after scroll
   *
   * Steps:
   * 1. DeployRepositoryCard - template selection and git configuration
   * 2. TemplateSettingsCard - template settings form
   * 3. DeployStatusCard - deploy progress, logs, and results
   * 4. DeploySuccessCard - success confirmation with app URL and next steps
   */
  import { ref, computed, nextTick } from 'vue'
  import DeployRepositoryCard from './DeployRepositoryCard.vue'
  import TemplateSettingsCard from './TemplateSettingsCard.vue'
  import DeployStatusCard from './DeployStatusCard.vue'
  import DeploySuccessCard from './DeploySuccessCard.vue'

  // ============================================================================
  // Props
  // ============================================================================
  const props = defineProps({
    // Data for template - passed to both steps
    previewSrc: {
      type: String,
      default: ''
    },
    previewAlt: {
      type: String,
      default: ''
    },
    templateTitle: {
      type: String,
      required: true
    },
    templateUrl: {
      type: String,
      required: true
    },
    templateDescription: {
      type: String,
      default: ''
    },
    githubUrl: {
      type: String,
      default: ''
    },

    // Form props
    schema: {
      type: Object,
      default: () => ({})
    },
    isDrawer: {
      type: Boolean,
      default: false
    },

    // Button states
    loadingDeploy: {
      type: Boolean,
      default: false
    },
    loadingNext: {
      type: Boolean,
      default: false
    },
    disabledNext: {
      type: Boolean,
      default: false
    },
    disabledDeploy: {
      type: Boolean,
      default: false
    },

    // Deploy Status Card props
    executionId: {
      type: String,
      default: ''
    },
    getLogsService: {
      type: Function,
      default: null
    },
    results: {
      type: Object,
      default: null
    },
    deployFailed: {
      type: Boolean,
      default: false
    },
    applicationName: {
      type: String,
      default: ''
    },
    deployStartTime: {
      type: Number,
      default: null
    },
    nextSteps: {
      type: Array,
      default: () => [
        {
          title: 'Customize Domain',
          description: 'Associate a custom domain and subdomains to Azion to handle user access.',
          handle: () => {}
        },
        {
          title: 'Point Traffic',
          description:
            'Redirect the traffic of a domain to Azion and take advantage of the distributed network.',
          handle: () => {}
        },
        {
          title: 'View Analytics',
          description: 'Gain powerful insights into your performance, availability, and security.',
          handle: () => {}
        }
      ]
    },

    // Deploy Success Card props
    appUrl: {
      type: String,
      default: ''
    },
    successNextSteps: {
      type: Array,
      default: () => []
    }
  })

  // ============================================================================
  // Emits
  // ============================================================================
  const emit = defineEmits(['deploy', 'finish', 'retry', 'manage', 'open-url', 'next-step'])

  // ============================================================================
  // State
  // ============================================================================
  const currentStep = ref('repository')
  const step2Ref = ref(null)
  const step3Ref = ref(null)
  const step4Ref = ref(null)

  // ============================================================================
  // Computed
  // ============================================================================
  /**
   * Props to pass to DeployRepositoryCard
   */
  const repositoryCardProps = computed(() => ({
    previewSrc: props.previewSrc,
    previewAlt: props.previewAlt,
    templateTitle: props.templateTitle,
    templateUrl: props.templateUrl,
    templateDescription: props.templateDescription,
    githubUrl: props.githubUrl,
    schema: props.schema,
    isDrawer: props.isDrawer,
    loading: props.loadingNext,
    disabled: props.disabledNext,
    collapsed:
      currentStep.value === 'settings' ||
      currentStep.value === 'deploying' ||
      currentStep.value === 'success'
  }))

  /**
   * Props to pass to TemplateSettingsCard
   */
  const settingsCardProps = computed(() => ({
    previewSrc: props.previewSrc,
    previewAlt: props.previewAlt,
    templateTitle: props.templateTitle,
    templateUrl: props.templateUrl,
    githubUrl: props.githubUrl,
    loadingDeploy: props.loadingDeploy,
    disabledDeploy: props.disabledDeploy
  }))

  /**
   * Props to pass to DeployStatusCard
   */
  const statusCardProps = computed(() => ({
    executionId: props.executionId,
    getLogsService: props.getLogsService,
    results: props.results,
    deployFailed: props.deployFailed,
    applicationName: props.applicationName,
    deployStartTime: props.deployStartTime,
    nextSteps: props.nextSteps
  }))

  /**
   * Props to pass to DeploySuccessCard
   */
  const successCardProps = computed(() => ({
    appUrl: props.appUrl,
    previewSrc: props.previewSrc,
    previewAlt: props.previewAlt,
    templateTitle: props.templateTitle,
    templateUrl: props.templateUrl,
    templateDescription: props.templateDescription,
    githubUrl: props.githubUrl,
    nextSteps: props.successNextSteps
  }))

  // ============================================================================
  // Methods
  // ============================================================================
  /**
   * Navigate to settings step (step 2)
   * Smooth scrolls to step 2, keeping step 1 visible
   */
  const goToSettings = () => {
    currentStep.value = 'settings'

    nextTick(() => {
      // Scroll to step 2 but keep step 1 visible (center alignment)
      step2Ref.value?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      })
    })
  }

  /**
   * Navigate to deploying step (step 3)
   * Called when user clicks Deploy on TemplateSettingsCard
   */
  const goToDeploying = () => {
    currentStep.value = 'deploying'

    nextTick(() => {
      // Scroll to step 3
      step3Ref.value?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
    })
  }

  /**
   * Handle deploy action
   * Called when user clicks Deploy on TemplateSettingsCard
   */
  const handleDeploy = () => {
    goToDeploying()
    emit('deploy')
  }

  /**
   * Navigate to success step (step 4)
   * Called after deploy finishes successfully
   */
  const goToSuccess = () => {
    currentStep.value = 'success'

    nextTick(() => {
      step4Ref.value?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
    })
  }

  /**
   * Handle deploy finish - navigate to success card
   * Called when deploy completes successfully
   */
  const handleFinish = () => {
    goToSuccess()
    emit('finish')
  }

  /**
   * Handle deploy success with app URL
   * Alternative entry point when appUrl is available
   */
  const onDeploySuccess = (url) => {
    goToSuccess()
    emit('finish', { appUrl: url })
  }

  /**
   * Handle retry action
   */
  const handleRetry = () => {
    currentStep.value = 'settings'
    emit('retry')
  }

  /**
   * Handle manage action
   */
  const handleManage = (data) => {
    emit('manage', data)
  }

  /**
   * Handle open URL action
   */
  const handleOpenUrl = (url) => {
    emit('open-url', url)
  }

  /**
   * Handle next step action
   */
  const handleNextStep = (data) => {
    emit('next-step', data)
  }

  /**
   * Reset flow to first step
   * Can be called externally via ref
   */
  const reset = () => {
    currentStep.value = 'repository'
  }

  // ============================================================================
  // Expose
  // ============================================================================
  defineExpose({
    reset,
    goToSettings,
    goToDeploying,
    goToSuccess,
    onDeploySuccess,
    currentStep
  })
</script>

<template>
  <div class="deploy-template-flow flex flex-col gap-6">
    <DeployRepositoryCard
      v-bind="repositoryCardProps"
      @next="goToSettings"
    >
      <template #preview="slotProps">
        <slot
          name="preview"
          v-bind="slotProps"
        />
      </template>

      <template #info="slotProps">
        <slot
          name="info"
          v-bind="slotProps"
        />
      </template>

      <template #github-connection="slotProps">
        <slot
          name="github-connection"
          v-bind="slotProps"
        />
      </template>

      <template #inputs="slotProps">
        <slot
          name="inputs"
          v-bind="slotProps"
        />
      </template>

      <template #form-content="slotProps">
        <slot
          name="form-content"
          v-bind="slotProps"
        />
      </template>

      <template
        v-if="$slots['repository-footer-actions']"
        #footer-actions
      >
        <slot name="repository-footer-actions" />
      </template>
    </DeployRepositoryCard>

    <div
      ref="step2Ref"
      v-show="currentStep === 'settings' || currentStep === 'deploying'"
    >
      <TemplateSettingsCard
        v-bind="settingsCardProps"
        :hide-footer="currentStep === 'deploying'"
        @deploy="handleDeploy"
      >
        <!-- Pass through form slot -->
        <template #form>
          <slot name="settings-form" />
        </template>

        <template
          v-if="$slots['settings-footer-actions']"
          #footer-actions
        >
          <slot name="settings-footer-actions" />
        </template>
      </TemplateSettingsCard>
    </div>

    <div
      ref="step3Ref"
      v-show="currentStep === 'deploying'"
    >
      <DeployStatusCard
        v-bind="statusCardProps"
        @finish="handleFinish"
        @retry="handleRetry"
        @manage="handleManage"
        @open-url="handleOpenUrl"
        @next-step="handleNextStep"
      />
    </div>

    <div
      ref="step4Ref"
      v-show="currentStep === 'success'"
    >
      <DeploySuccessCard v-bind="successCardProps">
        <template #customize-domain>
          <slot name="customize-domain" />
        </template>
      </DeploySuccessCard>
    </div>
  </div>
</template>
