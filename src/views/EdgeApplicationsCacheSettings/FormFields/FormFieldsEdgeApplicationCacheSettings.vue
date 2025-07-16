<template>
  <FormHorizontal
    title="General"
    description="Create a set of cache configurations to apply to the edge application. Use Rules Engine to activate cache settings."
    isDrawer
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          name="name"
          label="Name"
          required
          placeholder="My cache setting"
          description="Give a unique and descriptive name to identify the cache setting."
          data-testid="edge-application-cache-settings-form__name-field"
        />
      </div>
    </template>
  </FormHorizontal>

  <BrowserCache />

  <EdgeCache @enableSliceConfiguration="enableSliceConfiguration" />

  <TieredCache v-if="showTieredCacheForm" />

  <ApplicationAccelerator v-if="isApplicationAcceleratorEnabled" />
</template>

<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldText from '@/templates/form-fields-inputs/fieldText'

  // Form blocks
  import BrowserCache from './blocks/BrowserCache.vue'
  import EdgeCache from './blocks/EdgeCache.vue'
  import TieredCache from './blocks/TieredCache.vue'
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
    }
  })

  const { value: isSliceTieredCache } = useField('isSliceTieredCache')
  const { value: isSliceEdgeCachingEnabled } = useField('isSliceEdgeCachingEnabled')
  const { value: tieredCache } = useField('tieredCache')

  const enableSliceConfiguration = (isEnabled) => {
    emit('tiered-caching-enabled', isSliceTieredCache.value)
    isSliceEdgeCachingEnabled.value = isEnabled
    isSliceTieredCache.value = isEnabled
    tieredCache.value = isEnabled
  }

  const showTieredCacheForm = computed(() => {
    return props.showTieredCache
  })
</script>
