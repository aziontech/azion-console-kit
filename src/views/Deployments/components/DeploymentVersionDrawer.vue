<script setup>
  import { computed } from 'vue'
  import Button from '@aziontech/webkit/button'
  import InfoDrawerBlock from '@/templates/info-drawer-block/index.vue'
  import StatusTag from '@/components/StatusTag'
  import InlineTag from '@/components/InlineTag'
  import EditorAvatarCell from '@/views/Deployments/components/EditorAvatarCell.vue'
  import { convertToRelativeTime } from '@/helpers/convert-date'

  defineOptions({ name: 'deployment-version-drawer' })

  const props = defineProps({
    visible: {
      type: Boolean,
      default: false
    },
    version: {
      type: Object,
      default: null
    }
  })

  const emit = defineEmits(['update:visible', 'rollback', 'redeploy'])

  const visibleDrawer = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  const visitUrl = computed(
    () => props.version?.urls?.deployment_url || props.version?.urls?.canonical_url || ''
  )

  const secondaryButtonLabel = computed(() => (props.version?.isCurrent ? 'Rollback' : 'Redeploy'))

  const onSecondaryAction = () => {
    if (!props.version) return
    if (props.version.isCurrent) {
      emit('rollback', props.version)
    } else {
      emit('redeploy', props.version)
    }
  }

  const resources = computed(() => props.version?.resources ?? [])

  const createdRelative = computed(() =>
    props.version?.created_at ? convertToRelativeTime(props.version.created_at) : ''
  )
</script>

<template>
  <InfoDrawerBlock
    v-model:visible="visibleDrawer"
    title="Deployment Details"
    width-class="max-w-6xl"
  >
    <template #header-actions>
      <a
        v-if="visitUrl"
        :href="visitUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-1 text-sm text-[var(--text-link,#3392ff)] hover:underline"
        data-testid="deployment-version-drawer__visit"
      >
        Visit
        <i
          class="pi pi-external-link text-xs"
          aria-hidden="true"
        />
      </a>
      <Button
        outlined
        :label="secondaryButtonLabel"
        :icon="secondaryButtonLabel === 'Rollback' ? 'pi pi-refresh' : 'pi pi-sync'"
        size="small"
        data-testid="deployment-version-drawer__secondary"
        @click="onSecondaryAction"
      />
    </template>

    <template #body>
      <div
        v-if="version"
        class="rounded-md border border-[var(--surface-border)] overflow-hidden bg-[var(--surface-section)]"
      >
        <div class="flex flex-wrap">
          <div
            class="flex flex-col items-start p-3 basis-full sm:basis-1/2 md:basis-1/3 border-b border-[var(--surface-border)] md:border-r"
          >
            <div class="flex items-center h-6">
              <span class="text-xs text-[var(--text-color-secondary)]">Environment</span>
            </div>
            <div class="flex items-center gap-1 h-6">
              <span
                v-if="version.environmentLabel"
                class="text-sm text-[var(--text-color)]"
              >
                {{ version.environmentLabel }}
              </span>
              <i
                v-if="version.environmentIcon"
                :class="[version.environmentIcon, 'text-xs text-[var(--text-color-secondary)]']"
                aria-hidden="true"
              />
              <InlineTag
                v-if="version.isCurrent"
                text="Current"
                type="info"
                icon="pi pi-arrow-circle-up"
              />
            </div>
          </div>

          <div
            class="flex flex-col items-start p-3 basis-full sm:basis-1/2 md:basis-1/3 border-b border-[var(--surface-border)] md:border-r"
          >
            <div class="flex items-center h-6">
              <span class="text-xs text-[var(--text-color-secondary)]">Status</span>
            </div>
            <div class="flex items-center gap-2 h-6">
              <StatusTag :status="version.status" />
              <span
                v-if="version.duration"
                class="text-xs text-[var(--text-color-secondary)] whitespace-nowrap"
              >
                {{ version.duration }}
              </span>
            </div>
          </div>

          <div
            class="flex flex-col items-start p-3 basis-full sm:basis-1/2 md:basis-1/3 border-b border-[var(--surface-border)]"
          >
            <div class="flex items-center h-6">
              <span class="text-xs text-[var(--text-color-secondary)]">Created</span>
            </div>
            <div class="flex items-center gap-1 h-6">
              <EditorAvatarCell :email="version.lastEditor" />
              <span
                v-if="createdRelative"
                class="text-xs text-[var(--text-color-secondary)] whitespace-nowrap"
              >
                {{ createdRelative }}
              </span>
            </div>
          </div>

          <div
            v-for="(resource, index) in resources"
            :key="resource.id || `${resource.type}-${index}`"
            class="flex flex-col items-start p-3 basis-full sm:basis-1/2 md:basis-1/3 border-b border-[var(--surface-border)] last:border-b-0 [&:not(:nth-child(3n))]:md:border-r"
          >
            <div class="flex items-center h-6">
              <span class="text-xs text-[var(--text-color-secondary)]">{{ resource.label }}</span>
            </div>
            <div class="flex items-center gap-1 h-6">
              <div class="flex items-center gap-3 p-1">
                <i
                  :class="[resource.icon, 'text-xs text-[var(--text-color-secondary)]']"
                  aria-hidden="true"
                />
                <span class="text-sm text-[var(--text-color)] truncate">{{
                  resource.name || '--'
                }}</span>
              </div>
              <span
                v-if="resource.versionId"
                class="text-xs text-[var(--text-color-secondary)] whitespace-nowrap"
              >
                {{ resource.versionId }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </InfoDrawerBlock>
</template>
