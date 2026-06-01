<script setup>
  import { computed } from 'vue'
  import Button from '@aziontech/webkit/button'
  import InfoDrawerBlock from '@/templates/info-drawer-block/index.vue'
  import DeploymentVersionDetails from '@/views/Deployments/components/DeploymentVersionDetails.vue'

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
      <DeploymentVersionDetails
        v-if="version"
        :version="version"
      />
    </template>
  </InfoDrawerBlock>
</template>
