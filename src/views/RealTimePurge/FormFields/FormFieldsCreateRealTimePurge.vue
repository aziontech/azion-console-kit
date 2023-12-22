<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import RadioButton from 'primevue/radiobutton'
  import Card from 'primevue/card'
  import PrimeButton from 'primevue/button'
  import PrimeTextarea from 'primevue/textarea'
  import { useField } from 'vee-validate'
  import { computed } from 'vue'

  const { value: layer } = useField('layer')
  const { value: argumentsPurge, errorMessage: argumentsPurgeError } = useField('argumentsPurge')
  const { value: purgeType } = useField('purgeType')

  const computedPurgeArgumentsPlaceHolder = computed(() => {
    if (purgeType.value === 'cachekey') {
      return 'https://www.example.com.br/index.html'
    }
    if (purgeType.value === 'wildcard') {
      return 'www.example.com/*'
    }
    return 'www.example.com'
  })

  const props = defineProps({
    contactSalesRealTimePurgeService: {
      type: Function,
      required: true
    }
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
                :pt="{
                  body: { class: 'p-4 border border-orange-500 rounded-md' },
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
                    value="edge_caching"
                    :disabled="true"
                    v-model="layer"
                  />
                  <span class="text-base">Edge Caching</span>
                </template>
                <template #subtitle>Purge content from Azion's edge network.</template>
              </Card>
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-color text-base font-medium">Subscription Layer</label>
            <div class="flex flex-col gap-3">
              <Card
                :pt="{
                  body: { class: 'p-4 opacity-50' },
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
                    :disabled="true"
                    value="l2_caching"
                    v-model="layer"
                  />
                  <span class="text-base">L2 Caching</span>
                </template>
                <template #subtitle>
                  Purge content from Azion's second cache layer. Requires subscribing to this module.</template
                >
              </Card>
            </div>
            <PrimeButton
              outlined
              icon="pi pi-shopping-cart"
              class="max-w-[150px] mt-4"
              label="Contact Sales"
              @click="props.contactSalesRealTimePurgeService()"
            />
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
                value="cachekey"
                v-model="purgeType"
              />
              <span class="text-base">Cache Key</span>
            </template>
            <template #subtitle
              >Enter a list of content cache keys to be purged.</template
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
                inputId="inputId2"
                name="type"
                value="url"
                v-model="purgeType"
              />
              <span class="text-base">URL</span>
            </template>
            <template #subtitle
              >Enter a list of content URLs to be purged. Asterisks (*) in URLs are considered characters.</template
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
                value="wildcard"
                v-model="purgeType"
              />
              <span class="text-base">Wildcard</span>
            </template>
            <template #subtitle
              >Enter a list of content URLs to be purged. Asterisks (*) are considered wildcard expressions.</template
            >
          </Card>
        </div>
      </template>
    </FormHorizontal>

    <FormHorizontal
      title="Arguments"
      description="Insert values related to cache key, URL, or wildcard expression."
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

          <div class="text-color-secondary text-sm font-normal">
            Separate each argument using a new line.
          </div>
        </div>
      </template>
    </FormHorizontal>
  </div>
</template>
