<script setup>
  /**
   * TemplateSettingsCard.vue
   *
   * Step 2 of the deploy template flow.
   * Displays template settings form with compact preview in header-meta.
   *
   * Uses BaseDeployCard for layout structure.
   * Emits @deploy when user clicks the Deploy button.
   *
   * This component is stateless - all state lives in the orchestrator.
   */
  import PrimeButton from 'primevue/button'
  import BaseDeployCard from './BaseDeployCard.vue'

  // ============================================================================
  // Props
  // ============================================================================
  const props = defineProps({
    // Preview for header-meta (compact summary from step 1)
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
    githubUrl: {
      type: String,
      default: ''
    },

    // Footer action
    loadingDeploy: {
      type: Boolean,
      default: false
    },
    disabledDeploy: {
      type: Boolean,
      default: false
    },
    deployLabel: {
      type: String,
      default: 'Deploy'
    }
  })

  // ============================================================================
  // Emits
  // ============================================================================
  const emit = defineEmits(['deploy'])

  // ============================================================================
  // Methods
  // ============================================================================
  const handleDeploy = () => {
    emit('deploy')
  }
</script>

<template>
  <BaseDeployCard title="Template Settings">
    <template #header-meta>
      <div class="flex items-center gap-3">
        <div class="hidden sm:flex w-12 h-12 shrink-0 rounded overflow-hidden bg-surface-section">
          <img
            v-if="props.previewSrc"
            :src="props.previewSrc"
            :alt="props.previewAlt || props.templateTitle"
            class="w-full h-full object-cover"
          />
        </div>

        <div class="flex-1 flex flex-col gap-1 min-w-0">
          <div class="flex items-center gap-1.5">
            <a
              v-if="props.templateUrl"
              :href="props.templateUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="text-sm font-semibold text-color hover:text-primary transition-colors line-clamp-1"
            >
              {{ props.templateTitle }}
            </a>
            <span
              v-else
              class="text-sm font-semibold text-color line-clamp-1"
            >
              {{ props.templateTitle }}
            </span>
            <div
              v-if="props.templateUrl"
              class="w-3 h-3 shrink-0 relative overflow-hidden"
            >
              <i class="pi pi-external-link text-[10px] text-color-secondary" />
            </div>
          </div>

          <div
            v-if="props.githubUrl"
            class="flex items-center gap-1"
          >
            <i class="pi pi-github text-color-secondary text-[12px]" />
            <span class="text-[10px] text-color-secondary leading-3 line-clamp-1">
              {{ props.githubUrl }}
            </span>
          </div>
        </div>
      </div>
    </template>

    <template #content>
      <slot name="form">
        <div class="flex flex-col gap-6"></div>
      </slot>
    </template>

    <template #footer>
      <slot name="footer-actions">
        <PrimeButton
          class="w-full flex-row-reverse"
          :label="props.deployLabel"
          :loading="props.loadingDeploy"
          :disabled="props.disabledDeploy"
          severity="primary"
          @click="handleDeploy"
        />
      </slot>
    </template>
  </BaseDeployCard>
</template>
