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
      description="Description"
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
                <template #subtitle>Purge web content delivered at the Edge</template>
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
                  Purge web content in the layer nearest to your origin.</template
                >
              </Card>
            </div>
            <PrimeButton
              outlined
              icon="pi pi-shopping-cart"
              class="max-w-[150px] mt-4"
              label="Contact sales"
              @click="props.contactSalesRealTimePurgeService()"
            />
          </div>
        </div>
      </template>
    </FormHorizontal>

    <FormHorizontal
      title="Purge Type"
      description="You can instantly delete your content cache in Azion, by using a Cache Key List, a URL List or a Wildcard expression that represents the objects you want to purge."
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
              >Is the most accurate way to purge your content cache by passing a cache key list of
              up to 50 objects per request.</template
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
              >Is the simplest way to purge your content cache by passing a URL list of up to 50
              objects per request. You cannot purge content cache variations with this
              method.</template
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
              >is a powerful way to purge a list of objects by passing a Wildcard expression. You
              can use the wildcard character (*) in path or query string arguments.</template
            >
          </Card>
        </div>
      </template>
    </FormHorizontal>

    <FormHorizontal
      title="Arguments"
      description="Description"
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
            Separate arguments using new line.
          </div>
        </div>
      </template>
    </FormHorizontal>
  </div>
</template>
