<template>
  <FormHorizontal
    title="General"
    description="Create a set of cache configurations to apply to the application. Use Rules Engine to activate cache settings."
    isDrawer
  >
    <template #inputs>
      <FieldText
        name="name"
        label="Name"
        required
        :disabled="disabledFields"
        placeholder="My cache setting"
        description="Give a unique and descriptive name to identify the cache setting."
        data-testid="edge-application-cache-settings-form__name-field"
      />
    </template>
  </FormHorizontal>

  <BrowserCache :disabledFields="disabledFields" />

  <EdgeCache
    :isTieredCacheEnabled="showTieredCacheForm"
    :disabledFields="disabledFields"
    @enableSliceConfiguration="enableSliceConfiguration"
  />

  <ApplicationAccelerator
    v-if="isApplicationAcceleratorEnabled"
    :disabledFields="disabledFields"
  />
</template>

<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldText from '@aziontech/webkit/field-text'

  // Form blocks
  import BrowserCache from './blocks/BrowserCache.vue'
  import EdgeCache from './blocks/EdgeCache.vue'
  import ApplicationAccelerator from './blocks/ApplicationAccelerator.vue'

  import { useField } from 'vee-validate'
  import { computed } from 'vue'

  const emit = defineEmits(['tiered-caching-enabled'])

  const props = defineProps({
    isApplicationAcceleratorEnabled: {
      required: true,
      type: Boolean
    },
    showTieredCache: {
      type: Boolean,
      required: true
    },
    disabledFields: {
      type: Boolean,
      default: false
    }
  })

  const { value: isSliceTieredCache } = useField('isSliceTieredCache')
  const { value: isSliceEdgeCachingEnabled } = useField('isSliceEdgeCachingEnabled')

  const enableSliceConfiguration = (isEnabled) => {
    emit('tiered-caching-enabled', isSliceTieredCache.value)
    isSliceEdgeCachingEnabled.value = isEnabled
    isSliceTieredCache.value = isEnabled
  }

  const showTieredCacheForm = computed(() => {
    return props.showTieredCache
  })
</script>
