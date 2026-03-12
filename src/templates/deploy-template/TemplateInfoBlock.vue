<script setup>
  /**
   * TemplateInfoBlock.vue
   *
   * Reusable presentational component for displaying template preview and info.
   * Used by DeployRepositoryCard and DeploySuccessCard to maintain visual consistency.
   *
   * Structure:
   * - Left: Preview image (w-72, h-48)
   * - Right: Template title, description, and GitHub URL
   *
   * This component is 100% presentational - no state, no business logic.
   *
   * Props:
   * - previewSrc: Image source for preview
   * - previewAlt: Alt text for preview image
   * - templateTitle: Template title (required)
   * - templateUrl: Template URL - makes title clickable
   * - templateDescription: Template description text
   * - githubUrl: GitHub repository URL
   */
  const props = defineProps({
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
    }
  })
</script>

<template>
  <div
    class="bg-[var(--surface-50)] rounded-lg border surface-border flex flex-col md:flex-row gap-5 overflow-hidden"
  >
    <div class="w-full md:w-72 shrink-0 flex flex-col justify-center items-center">
      <slot
        name="preview"
        :preview-src="props.previewSrc"
        :preview-alt="props.previewAlt"
      >
        <div
          class="w-full h-48 bg-surface-section rounded-lg flex flex-col justify-center items-center overflow-hidden"
        >
          <img
            v-if="props.previewSrc"
            :src="props.previewSrc"
            :alt="props.previewAlt || props.templateTitle"
            class="w-full h-40 object-cover"
          />
        </div>
      </slot>
    </div>

    <div class="flex-1 py-4 pr-4 flex flex-col gap-3">
      <slot
        name="info"
        :template-title="props.templateTitle"
        :template-url="props.templateUrl"
        :template-description="props.templateDescription"
        :github-url="props.githubUrl"
      >
        <div
          v-if="props.templateTitle"
          class="flex items-center gap-2.5"
        >
          <div class="flex-1 flex items-center gap-1.5">
            <div class="flex-1 flex flex-col justify-center gap-1">
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
                  class="w-3 h-3 relative overflow-hidden"
                >
                  <i class="pi pi-external-link text-[10px] text-color-secondary" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <p
          v-if="props.templateDescription"
          class="text-xs text-color-secondary leading-4"
        >
          {{ props.templateDescription }}
        </p>
        <div class="flex flex-col gap-1.5">
          <span class="text-[10px] text-color-secondary leading-3">Cloning from</span>
          <div class="flex items-center gap-1">
            <i class="pi pi-github text-color-secondary text-[14px]" />
            <span class="text-[10px] text-color-secondary leading-3 line-clamp-3">
              {{ props.githubUrl }}
            </span>
          </div>
        </div>
      </slot>
    </div>
  </div>
</template>
