<script setup>
  /**
   * DeploySuccessCard.vue
   *
   * Step 3 of the deploy template flow (success state).
   * Displays deployment success confirmation with app URL, template info, and next steps.
   *
   * Uses BaseDeployCard for layout structure.
   * Uses TemplateInfoBlock for preview + info block consistency.
   *
   * This component is stateless - all state lives in the orchestrator.
   */
  import { computed } from 'vue'
  import Accordion from 'primevue/accordion'
  import AccordionTab from 'primevue/accordiontab'
  import BaseDeployCard from './BaseDeployCard.vue'
  import TemplateInfoBlock from './TemplateInfoBlock.vue'

  // ============================================================================
  // Props
  // ============================================================================
  const props = defineProps({
    // Status message
    appUrl: {
      type: String,
      required: true
    },

    // Preview block — same pattern as DeployRepositoryCard
    previewSrc: {
      type: String,
      default: ''
    },
    previewAlt: {
      type: String,
      default: ''
    },

    // Info block
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

    // Next Steps — list of action items configured externally
    nextSteps: {
      type: Array,
      default: () => []
    }
  })

  // ============================================================================
  // Computed
  // ============================================================================
  /**
   * Extract domain from appUrl for display
   */
  const appUrlDisplay = computed(() => {
    try {
      const url = new URL(props.appUrl)
      return url.host + url.pathname
    } catch {
      return props.appUrl
    }
  })

  // ============================================================================
  // Methods
  // ============================================================================
  /**
   * Handle click on next step item
   */
  const handleStepClick = (step) => {
    if (step.action) {
      step.action()
    } else if (step.href) {
      window.open(step.href, '_blank', 'noopener,noreferrer')
    }
  }
</script>

<template>
  <BaseDeployCard
    title="Deployment Successful"
    :hide-footer="true"
  >
    <template #content>
      <!-- [1] Status message with app URL link -->
      <p class="text-sm text-color-secondary leading-5">
        Your application is being distributed, in few minutes, the application will be available on
        <a
          :href="props.appUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="text-primary hover:text-primary-hover transition-colors inline-flex items-center gap-1"
        >
          <span class="underline">{{ appUrlDisplay }}</span>
          <i class="pi pi-external-link text-[10px]" /> </a
        >.
      </p>

      <!-- [2] Preview + Info block -->
      <TemplateInfoBlock
        :preview-src="props.previewSrc"
        :preview-alt="props.previewAlt"
        :template-title="props.templateTitle"
        :template-url="props.templateUrl"
        :template-description="props.templateDescription"
        :github-url="props.githubUrl"
      />

      <!-- [3] Additional Settings -->
      <div class="flex flex-col gap-3">
        <span class="text-sm font-semibold text-color">Additional Settings</span>
        <Accordion>
          <AccordionTab header="Customize Domain">
            <slot name="customize-domain">
              <!-- Empty by default - content injected via slot -->
            </slot>
          </AccordionTab>
        </Accordion>
      </div>

      <!-- [4] Next Steps -->
      <div
        v-if="props.nextSteps.length > 0"
        class="flex flex-col gap-3"
      >
        <span class="text-sm font-semibold text-color">Next Steps</span>
        <div class="flex flex-col gap-2">
          <div
            v-for="(step, index) in props.nextSteps"
            :key="index"
            class="h-11 rounded-md outline border border-[var(--surface-border)] bg-neutral-950 flex items-center px-3 cursor-pointer hover:border-primary transition-colors"
            @click="handleStepClick(step)"
          >
            <!-- Icon box -->
            <div
              class="p-1.5 bg-[var(--surface-100)] rounded mr-3 flex items-center justify-center"
            >
              <i
                v-if="step.icon && step.icon.startsWith('pi-')"
                :class="['pi', step.icon, 'w-3.5 h-3.5 text-color']"
              />
              <img
                v-else-if="step.icon"
                :src="step.icon"
                :alt="step.label"
                class="w-3.5 h-3.5"
              />
            </div>

            <!-- Label -->
            <span class="flex-1 text-xs font-semibold font-['Sora'] leading-7 text-color">
              {{ step.label }}
            </span>

            <!-- Chevron button -->
            <div
              class="w-8 h-8 rounded-md flex items-center justify-center hover:bg-[var(--surface-100)] transition-colors"
            >
              <i class="pi pi-chevron-right w-3.5 h-3.5 text-color-secondary" />
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <slot name="footer">
        <!-- Empty by default - deploy already completed -->
      </slot>
    </template>
  </BaseDeployCard>
</template>
