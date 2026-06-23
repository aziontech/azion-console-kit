<script setup>
  import { computed } from 'vue'
  import StatusTag from '@/components/StatusTag'
  import InlineTag from '@/components/InlineTag'
  import DeploymentLogsAccordion from '@/views/Deployments/components/DeploymentLogsAccordion.vue'
  import { deploymentLogsMock } from '@/views/Deployments/components/deployment-logs.mock'
  import { convertToRelativeTime } from '@/helpers/convert-date'

  defineOptions({ name: 'deployment-release-details' })

  const props = defineProps({
    release: {
      type: Object,
      required: true
    },
    logs: {
      type: Array,
      default: () => deploymentLogsMock
    }
  })

  const resources = computed(() => props.release?.resources ?? [])

  const createdRelative = computed(() =>
    props.release?.created_at ? convertToRelativeTime(props.release.created_at) : ''
  )
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="rounded-md border border-[var(--surface-border)] overflow-hidden">
      <div class="flex flex-wrap gap-px bg-[var(--surface-border)]">
        <div
          class="flex flex-col items-start p-3 bg-[var(--surface-section)] grow basis-full sm:basis-[calc((100%_-_1px)/2)] md:basis-[calc((100%_-_2px)/3)] min-w-0"
        >
          <div class="flex items-center h-6">
            <span class="text-xs text-[var(--text-color-secondary)]">Environment</span>
          </div>
          <div class="flex items-center gap-1 h-6 w-full min-w-0">
            <span
              v-if="release.environmentLabel"
              class="text-sm text-[var(--text-color)]"
            >
              {{ release.environmentLabel }}
            </span>
            <i
              v-if="release.environmentIcon"
              :class="[release.environmentIcon, 'text-xs text-[var(--text-color-secondary)]']"
              aria-hidden="true"
            />
            <InlineTag
              v-if="release.isCurrent"
              text="Current"
              type="info"
              icon="pi pi-arrow-circle-up"
            />
          </div>
        </div>

        <div
          class="flex flex-col items-start p-3 bg-[var(--surface-section)] grow basis-full sm:basis-[calc((100%_-_1px)/2)] md:basis-[calc((100%_-_2px)/3)] min-w-0"
        >
          <div class="flex items-center h-6">
            <span class="text-xs text-[var(--text-color-secondary)]">Status</span>
          </div>
          <div class="flex items-center gap-2 h-6 w-full min-w-0">
            <StatusTag :status="release.status" />
            <span
              v-if="release.duration"
              class="text-xs text-[var(--text-color-secondary)] whitespace-nowrap"
            >
              Deployed in {{ release.duration }}
            </span>
          </div>
        </div>

        <div
          class="flex flex-col items-start p-3 bg-[var(--surface-section)] grow basis-full sm:basis-[calc((100%_-_1px)/2)] md:basis-[calc((100%_-_2px)/3)] min-w-0"
        >
          <div class="flex items-center h-6">
            <span class="text-xs text-[var(--text-color-secondary)]">Created</span>
          </div>
          <div class="flex items-center gap-2 h-6 w-full min-w-0">
            <span
              v-if="release.lastEditor"
              class="text-sm text-[var(--text-color)] truncate"
              data-sentry-mask
            >
              {{ release.lastEditor }}
            </span>
            <span
              v-if="createdRelative"
              class="text-xs text-[var(--text-color-secondary)] whitespace-nowrap shrink-0"
            >
              {{ createdRelative }}
            </span>
          </div>
        </div>

        <div
          v-for="(resource, index) in resources"
          :key="resource.id || `${resource.type}-${index}`"
          class="flex flex-col items-start p-3 bg-[var(--surface-section)] grow basis-full sm:basis-[calc((100%_-_1px)/2)] md:basis-[calc((100%_-_2px)/3)] min-w-0"
        >
          <div class="flex items-center h-6">
            <span class="text-xs text-[var(--text-color-secondary)]">{{ resource.label }}</span>
          </div>
          <div class="flex items-center gap-1 h-6 w-full min-w-0">
            <div class="flex items-center gap-3 p-1 min-w-0">
              <i
                :class="[resource.icon, 'text-xs text-[var(--text-color-secondary)] shrink-0']"
                aria-hidden="true"
              />
              <span class="text-sm text-[var(--text-color)] truncate">{{
                resource.name || '--'
              }}</span>
            </div>
            <span
              v-if="resource.versionName || resource.versionId"
              class="text-xs text-[var(--text-color-secondary)] whitespace-nowrap shrink-0"
            >
              {{ resource.versionName || resource.versionId }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <DeploymentLogsAccordion :logs="logs" />
  </div>
</template>
