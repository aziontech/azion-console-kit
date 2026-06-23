<script setup>
  import { computed } from 'vue'
  import InlineMessage from '@aziontech/webkit/inlinemessage'

  defineOptions({ name: 'deploy-drawer-promotion-context-banner' })

  const props = defineProps({
    resourceContext: {
      type: Object,
      required: true
    }
  })

  const resourceName = computed(() => props.resourceContext?.resourceName ?? '')

  const versionLabel = computed(() => {
    const id = props.resourceContext?.version?.id ?? null
    if (!id) return ''
    const options = props.resourceContext?.versions ?? []
    return options.find((option) => option.value === id)?.label ?? id
  })
</script>

<template>
  <InlineMessage
    class="w-full"
    severity="info"
    data-testid="deploy-drawer__context-banner"
  >
    <span class="flex flex-col gap-[var(--spacing-1)] text-left">
      <span class="text-body-sm text-[var(--text-color)]">
        Promoting version
        <code
          class="rounded-[var(--shape-elements)] border border-[var(--surface-border)] bg-[var(--surface-section)] px-[6px] py-[2px] font-mono text-body-xs text-[var(--text-color)]"
          data-testid="deploy-drawer__context-version-chip"
          >{{ versionLabel }}</code
        >
        of
        <span class="font-medium">{{ resourceName }}</span
        >. It only serves traffic as part of a Release.
      </span>
      <span class="text-body-xs text-[var(--text-color-secondary)]">
        Below, the Environments that consume this resource.
      </span>
    </span>
  </InlineMessage>
</template>
