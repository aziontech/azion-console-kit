<script setup>
  import { computed } from 'vue'

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
      default: ''
    },
    templateUrl: {
      type: String,
      default: ''
    },
    templateDescription: {
      type: String,
      default: ''
    },
    githubUrl: {
      type: String,
      default: ''
    },
    domainUrl: {
      type: String,
      default: ''
    },
    edgeApplicationName: {
      type: String,
      default: ''
    },
    // Resources created during deployment
    resources: {
      type: Array,
      default: () => []
    },
    // When true, only show resources created section (for DeploySuccessCard)
    resourcesOnly: {
      type: Boolean,
      default: false
    }
  })

  const hasPreview = computed(() => {
    return props.previewSrc || (props.templateTitle && props.templateDescription && props.githubUrl)
  })

  // In resourcesOnly mode (DeploySuccessCard) the title/description/github block is hidden,
  // but the template's preview image should still surface when it was provided.
  const showPreview = computed(() => {
    if (props.resourcesOnly) return !!props.previewSrc
    return hasPreview.value
  })
</script>

<template>
  <div
    :class="[
      'bg-[var(--surface-50)] rounded-lg border surface-border flex flex-col md:flex-row gap-5 overflow-hidden',
      { '!flex-col': !showPreview }
    ]"
  >
    <!-- Preview section: render whenever showPreview is true -->
    <div
      v-if="showPreview"
      class="w-full md:w-72 shrink-0 flex flex-col justify-center items-center"
    >
      <slot
        name="preview"
        :preview-src="props.previewSrc"
        :preview-alt="props.previewAlt"
      >
        <div
          class="w-full bg-surface-section l-rounded-lg flex flex-col justify-center items-center overflow-hidden"
        >
          <img
            v-if="props.previewSrc"
            :src="props.previewSrc"
            :alt="props.previewAlt || props.templateTitle"
            class="w-full h-full object-cover"
          />
        </div>
      </slot>
    </div>

    <div
      :class="[
        'flex-1 flex flex-col gap-3',
        showPreview ? 'p-4 md:pl-0 md:pr-4 md:py-4' : 'p-4'
      ]"
    >
      <slot
        name="info"
        :template-title="props.templateTitle"
        :template-url="props.templateUrl"
        :template-description="props.templateDescription"
        :github-url="props.githubUrl"
      >
        <div
          v-if="!props.resourcesOnly && props.templateTitle"
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
                  class="text-sm font-semibold text-color transition-colors line-clamp-1"
                >
                  {{ props.templateTitle }}
                </a>
                <span
                  v-else
                  class="text-sm font-semibold text-color line-clamp-1"
                >
                  {{ props.templateTitle }}
                </span>
                <i
                  v-if="props.templateUrl"
                  class="pi pi-external-link text-color-secondary"
                />
              </div>
            </div>
          </div>
        </div>

        <p
          v-if="!props.resourcesOnly && props.templateDescription"
          class="text-xs text-color-secondary leading-4"
        >
          {{ props.templateDescription }}
        </p>
        <div
          v-if="!props.resourcesOnly"
          class="flex flex-col gap-1.5"
        >
          <span class="text-[10px] text-color-secondary leading-3">Cloning from</span>
          <div class="flex items-center gap-1">
            <i class="pi pi-github text-color-secondary text-[14px]" />
            <span class="text-[10px] text-color-secondary leading-3 line-clamp-3">
              {{ props.githubUrl }}
            </span>
          </div>
        </div>
        <!-- Resources Created Section -->
        <div
          v-if="props.resources && props.resources.length > 0"
          :class="['flex flex-col', showPreview ? 'gap-3 pt-2' : 'gap-2']"
        >
          <span class="text-xs font-normal font-['Proto_Mono'] text-color-muted leading-4">
            resources created
          </span>
          <div
            :class="[
              'flex flex-wrap gap-x-4 gap-y-1.5',
              showPreview ? 'flex-col gap-2' : ''
            ]"
          >
            <div
              v-for="(resource, index) in props.resources"
              :key="index"
              class="flex items-center gap-1.5"
            >
              <i
                :class="[resource.icon, 'text-color-secondary', 'text-[14px]']"
                style="width: 14px; height: 14px"
              />
              <span class="text-xs font-normal font-['Sora'] text-color-secondary leading-4">
                {{ resource.type }}:
              </span>
              <a
                v-if="resource.url"
                :href="resource.url"
                target="_blank"
                rel="noopener noreferrer"
                class="text-xs font-normal font-['Sora'] text-color leading-4 cursor-pointer hover:text-link transition-colors underline-offset-2 hover:underline"
              >
                {{ resource.name }}
              </a>
              <span
                v-else
                class="text-xs font-normal font-['Sora'] text-color leading-4 cursor-pointer hover:text-link transition-colors underline-offset-2 hover:underline"
                @click="resource.redirect?.()"
              >
                {{ resource.name }}
              </span>
            </div>
          </div>
        </div>
      </slot>
    </div>
  </div>
</template>
