<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import Card from 'primevue/card'
  import RadioButton from 'primevue/radiobutton'
  import PrimeTextarea from 'primevue/textarea'
  import { useField } from 'vee-validate'
  import { computed, watch } from 'vue'

  const { value: layer } = useField('layer')
  const { value: argumentsPurge, errorMessage: argumentsPurgeError } = useField('argumentsPurge')
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

  const isDisabled = computed(() => {
    return layer.value === 'tiered_cache'
  })
</script>

<template>
  <div class="flex flex-col gap-8">
    <FormHorizontal
      title="Layer Settings"
      description="Select where the purge should be made."
    >
      <template #inputs>
        <div class="flex flex-col gap-8">
          <div class="flex flex-col gap-2">
            <label class="text-color text-base font-medium">Default Layer</label>
            <div class="flex flex-col gap-3">
              <Card
                :class="layer === 'edge_cache' ? 'border border-orange-500' : ''"
                :pt="{
                  body: { class: 'p-4 rounded-md' },
                  title: { class: 'flex items-center gap-3 text-base m-0 font-medium' },
                  subtitle: {
                    class: 'text-sm font-normal ml-8 text-color-secondary m-0 pr-0 md:pr-[2.5rem]'
                  }
                }"
              >
                <template #title>
                  <RadioButton
                    inputId="inputId1"
                    name="layer"
                    value="edge_cache"
                    v-model="layer"
                  />
                  <span class="text-base">Edge Cache</span>
                </template>
                <template #subtitle>Purge content from Azion's edge cache layer.</template>
              </Card>
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-color text-base font-medium">Subscription Layer</label>
            <div class="flex flex-col gap-3">
              <Card
                :class="layer === 'tiered_cache' ? 'border border-orange-500' : ''"
                :pt="{
                  body: { class: 'p-4' },
                  title: { class: 'flex items-center gap-3 text-base m-0 font-medium' },
                  subtitle: {
                    class: 'text-sm font-normal ml-8 text-color-secondary m-0 pr-0 md:pr-[2.5rem]'
                  }
                }"
              >
                <template #title>
                  <RadioButton
                    inputId="inputId1"
                    name="layer"
                    value="tiered_cache"
                    v-model="layer"
                  />
                  <span class="text-base">Tiered Cache</span>
                </template>
                <template #subtitle>
                  Purge content from Azion's tiered cache layer. Requires subscribing to this
                  module.</template
                >
              </Card>
            </div>
          </div>
        </div>
      </template>
    </FormHorizontal>

    <FormHorizontal
      title="Purge Type"
      description="Select how the content should be identified."
    >
      <template #inputs>
        <div class="flex flex-col gap-3">
          <Card
            :pt="{
              body: { class: 'p-4' },
              title: { class: 'flex items-center gap-3 text-base m-0 font-medium' },
              subtitle: {
                class: 'text-sm font-normal ml-8 text-color-secondary m-0 pr-0 md:pr-[2.5rem]'
              }
            }"
          >
            <template #title>
              <RadioButton
                inputId="inputId1"
                name="type"
                :disabled="isDisabled"
                value="cachekey"
                v-model="purgeType"
              />
              <span class="text-base">Cache Key</span>
            </template>
            <template #subtitle>Enter a list of content cache keys to be purged.</template>
          </Card>

          <Card
            :pt="{
              body: { class: 'p-4' },
              title: { class: 'flex items-center gap-3 text-base m-0 font-medium' },
              subtitle: {
                class: 'text-sm font-normal ml-8 text-color-secondary m-0 pr-0 md:pr-[2.5rem]'
              }
            }"
          >
            <template #title>
              <RadioButton
                inputId="inputId2"
                name="type"
                :disabled="isDisabled"
                value="url"
                v-model="purgeType"
              />
              <span class="text-base">URL</span>
            </template>
            <template #subtitle
              >Enter a list of content URLs to be purged. Asterisks (*) in URLs are considered
              characters.</template
            >
          </Card>
          <Card
            :pt="{
              body: { class: 'p-4' },
              title: { class: 'flex items-center gap-3 text-base m-0 font-medium' },
              subtitle: {
                class: 'text-sm font-normal ml-8 text-color-secondary m-0 pr-0 md:pr-[2.5rem]'
              }
            }"
          >
            <template #title>
              <RadioButton
                inputId="inputId3"
                name="type"
                :disabled="isDisabled"
                value="wildcard"
                v-model="purgeType"
              />
              <span class="text-base">Wildcard</span>
            </template>
            <template #subtitle
              >Enter a list of content URLs to be purged. Asterisks (*) are considered wildcard
              expressions.</template
            >
          </Card>
        </div>
      </template>
    </FormHorizontal>

    <FormHorizontal
      title="Arguments"
      description="Insert a list of cache keys, URLs, or wildcard expressions according to the purge type selected."
    >
      <template #inputs>
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <label
            for="id"
            class="text-color text-base font-medium"
            >Arguments List *</label
          >
          <PrimeTextarea
            autoResize
            rows="2"
            cols="30"
            :placeholder="computedPurgeArgumentsPlaceHolder"
            :class="{ 'p-invalid': argumentsPurgeError }"
            v-model="argumentsPurge"
          />
          <small
            v-if="argumentsPurgeError"
            class="p-error text-xs font-normal leading-tight"
            >{{ argumentsPurgeError }}</small
          >

          <small class="text-xs text-color-secondary font-normal leading-5">
            Separate each argument using a new line.
          </small>
        </div>
      </template>
    </FormHorizontal>
  </div>
</template>
