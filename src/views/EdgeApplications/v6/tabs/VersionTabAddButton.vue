<script setup>
  import { computed } from 'vue'
  import PrimeButton from '@aziontech/webkit/button'
  import { useVersionContext } from '@/composables/versioning/use-version-context'

  defineOptions({ name: 'version-tab-add-button' })

  const props = defineProps({
    tab: {
      type: Object,
      default: null
    },
    activeComponent: {
      type: Object,
      default: null
    },
    testidPrefix: {
      type: String,
      default: 'application-v6-edit'
    }
  })

  const { readOnly } = useVersionContext()

  const isVisible = computed(() => Boolean(props.tab?.canCreate) && !readOnly.value)

  const label = computed(() => props.tab?.addButtonLabel || 'Create')

  const addButtonTestid = computed(() => `${props.testidPrefix}__add-button`)

  const handleClick = () => {
    props.activeComponent?.openCreateDrawer?.()
  }
</script>

<template>
  <PrimeButton
    v-if="isVisible"
    :label="label"
    size="small"
    icon="pi pi-plus"
    @click="handleClick"
    :data-testid="addButtonTestid"
  />
</template>
