<script setup>
  /**
   * DeployTemplateFlow.vue
   *
   * Orchestrator component for the multi-step deploy template flow.
   * Manages state for the current step and coordinates scroll-based transitions.
   *
   * Uses simple vertical scroll:
   * - Both cards exist in the DOM simultaneously (stacked vertically)
   * - On "Next" click, smooth scrolls to reveal step 2 below step 1
   * - First card remains visible during and after scroll
   *
   * Steps:
   * 1. DeployRepositoryCard - template selection and git configuration
   * 2. TemplateSettingsCard - template settings form
   */
  import { ref, computed, nextTick } from 'vue'
  import DeployRepositoryCard from './DeployRepositoryCard.vue'
  import TemplateSettingsCard from './TemplateSettingsCard.vue'

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
    }
  })

  // ============================================================================
  // Emits
  // ============================================================================
  const emit = defineEmits(['deploy'])

  // ============================================================================
  // State
  // ============================================================================
  const currentStep = ref('repository')
  const step2Ref = ref(null)

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
    collapsed: currentStep.value === 'settings'
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
   * Handle deploy action
   * Called when user clicks Deploy on TemplateSettingsCard
   */
  const handleDeploy = () => {
    emit('deploy')
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
      v-show="currentStep === 'settings'"
    >
      <TemplateSettingsCard
        v-bind="settingsCardProps"
        @deploy="handleDeploy"
      >
        <!-- Pass through form slot -->
        <template #form>
          <slot name="settings-form" />
        </template>

        <template #footer-actions>
          <slot name="settings-footer-actions" />
        </template>
      </TemplateSettingsCard>
    </div>
  </div>
</template>
