<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldTextArea from '@/templates/form-fields-inputs/fieldTextArea.vue'
  import PrimeTag from 'primevue/tag'
  import { useField } from 'vee-validate'
  import { computed, watch } from 'vue'
  import FieldGroupRadio from '@/templates/form-fields-inputs/fieldGroupRadio'

  const { value: layer } = useField('layer')
  const { value: purgeType } = useField('purgeType')

  const computedPurgeArgumentsPlaceHolder = computed(() => {
    if (purgeType.value === 'cachekey') {
      return 'httpswww.example.com/images/image.jpg'
    }
    if (purgeType.value === 'wildcard') {
      return 'www.example.com/images/*'
    }
    return 'www.example.com/images/image.jpg'
  })

  watch(layer, (newValue) => {
    if (newValue === 'tiered_cache') {
      purgeType.value = 'cachekey'
    }
  })

  const layerRadioOptions = [
    {
      title: 'Edge Cache',
      inputValue: 'edge_cache',
      subtitle: `Purge content from Azion's edge cache layer.`
    }
  ]
  const subscriptionLayerRadioOptions = [
    {
      title: 'Tiered Cache',
      inputValue: 'tiered_cache',
      name: 'tiered-cache-layer',
      subtitle: `Purge content from Azion's tiered cache layer. Requires subscribing to this module.`
    }
  ]

  const isLayerTieredCache = computed(() => layer.value === 'tiered_cache')

  const purgeTypeRadioOptions = computed(() => {
    return [
      {
        title: 'Cache Key',
        inputValue: 'cachekey',
        name: 'cachekey-purge-type',
        disabled: isLayerTieredCache.value,
        subtitle: `Enter a list of content cache keys to be purged.`,
        tag: {
          value: 'Automatically enabled in all accounts.',
          icon: 'pi pi-lock'
        }
      },
      {
        title: 'URL',
        inputValue: 'url',
        name: 'url-purge-type',
        hide: isLayerTieredCache.value,
        subtitle: `Enter a list of content URLs to be purged. Asterisks (*) in URLs are considered characters.`
      },
      {
        title: 'Wildcard',
        inputValue: 'wildcard',
        name: 'wildcard-purge-type',
        hide: isLayerTieredCache.value,
        subtitle: `Enter a list of content URLs to be purged. Asterisks (*) are considered wildcard expressions.`
      }
    ]
  })
</script>

<template>
  <FormHorizontal
    title="Layer Settings"
    description="Select where the purge should be made."
  >
    <template #inputs>
      <FieldGroupRadio
        label="Default Layer"
        nameField="layer"
        isCard
        :options="layerRadioOptions"
      />

      <FieldGroupRadio
        label="Subscription Layer"
        nameField="layer"
        isCard
        :options="subscriptionLayerRadioOptions"
      />
    </template>
  </FormHorizontal>

  <FormHorizontal
    title="Purge Type"
    description="Select how the content should be identified."
  >
    <template #inputs>
      <FieldGroupRadio
        nameField="purgeType"
        isCard
        :options="purgeTypeRadioOptions"
      >
        <template #footer="{ item }">
          <PrimeTag
            v-if="item?.tag && isLayerTieredCache"
            :value="item.tag.value"
            :icon="item.tag.icon"
            severity="info"
            class="mt-3"
          />
        </template>
      </FieldGroupRadio>
    </template>
  </FormHorizontal>

  <FormHorizontal
    title="Arguments"
    description="Insert a list of cache keys, URLs, or wildcard expressions according to the purge type selected."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldTextArea
          data-testid="purge__arguments-field"
          label="Arguments List"
          required
          name="argumentsPurge"
          rows="2"
          :placeholder="computedPurgeArgumentsPlaceHolder"
          description="Separate each argument using a new line."
          autoResize
        />
      </div>
    </template>
  </FormHorizontal>
</template>
