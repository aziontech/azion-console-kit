<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Create Real-Time Purge"></PageHeadingBlock>
    </template>
    <template #content>
      <CreateFormBlock
        :createService="props.createRealTimePurgeService"
        :formData="values"
        :formMeta="meta"
        :isValid="meta.valid"
        :cleanFormCallback="resetForm"
      >
        <template #form>
          <FormHorizontal
            title="Purge"
            description="You can instantly delete your content cache in Azion, by using a Cache Key List, a URL List or a Wildcard expression that represents the objects you want to purge."
          >
            <template #inputs>
              <div class="flex flex-col gap-2">
                <label class="text-color text-base font-medium">Layer</label>
                <div class="flex flex-col gap-3">
                  <Card
                    :pt="{
                      body: { class: 'p-4' },
                      title: { class: 'flex justify-between  text-base m-0 font-medium' },
                      subtitle: {
                        class: 'text-sm font-normal text-color-secondary m-0 pr-0 md:pr-[2.5rem]'
                      }
                    }"
                  >
                    <template #title>
                      <span class="text-base">Edge Caching</span>
                      <RadioButton
                        inputId="inputId1"
                        name="layer"
                        value="edge_caching"
                        :disabled="true"
                        v-model="layer"
                      />
                    </template>
                    <template #subtitle>Purge web content delivered at the Edge</template>
                  </Card>

                  <Card
                    :pt="{
                      body: { class: 'p-4' },
                      title: { class: 'flex justify-between  text-base m-0 font-medium' },
                      subtitle: {
                        class: 'text-sm font-normal text-color-secondary m-0 pr-0 md:pr-[2.5rem]'
                      }
                    }"
                  >
                    <template #title>
                      <span class="text-base">L2 Caching</span>
                      <RadioButton
                        inputId="inputId1"
                        name="layer"
                        :disabled="true"
                        value="l2_caching"
                        v-model="layer"
                      />
                    </template>
                    <template #subtitle>
                      Purge web content in the layer nearest to your origin.</template
                    >
                  </Card>
                </div>
              </div>
              <div class="flex flex-col gap-2">
                <label class="text-color text-base font-medium">Purge Type</label>
                <div class="flex flex-col gap-3">
                  <Card
                    :pt="{
                      body: { class: 'p-4' },
                      title: { class: 'flex justify-between  text-base m-0 font-medium' },
                      subtitle: {
                        class: 'text-sm font-normal text-color-secondary m-0 pr-0 md:pr-[2.5rem]'
                      }
                    }"
                  >
                    <template #title>
                      <span class="text-base">Cache Key</span>
                      <RadioButton
                        inputId="inputId1"
                        name="type"
                        value="cachekey"
                        v-model="purge_type"
                      />
                    </template>
                    <template #subtitle
                      >is the most accurate way to purge your content cache by passing a cache key
                      list of up to 50 objects per request.</template
                    >
                  </Card>

                  <Card
                    :pt="{
                      body: { class: 'p-4' },
                      title: { class: 'flex justify-between  text-base m-0 font-medium' },
                      subtitle: {
                        class: 'text-sm font-normal text-color-secondary m-0 pr-0 md:pr-[2.5rem]'
                      }
                    }"
                  >
                    <template #title>
                      <span class="text-base">URL</span>
                      <RadioButton
                        inputId="inputId2"
                        name="type"
                        value="url"
                        v-model="purge_type"
                      />
                    </template>
                    <template #subtitle>
                      is the simplest way to purge your content cache by passing a URL list of up to
                      50 objects per request. You cannot purge content cache variations with this
                      method.</template
                    >
                  </Card>
                  <Card
                    :pt="{
                      body: { class: 'p-4' },
                      title: { class: 'flex justify-between  text-base m-0 font-medium' },
                      subtitle: {
                        class: 'text-sm font-normal text-color-secondary m-0 pr-0 md:pr-[2.5rem]'
                      }
                    }"
                  >
                    <template #title>
                      <span class="text-base">Wildcard</span>
                      <RadioButton
                        inputId="inputId3"
                        name="type"
                        value="wildcard"
                        v-model="purge_type"
                      />
                    </template>
                    <template #subtitle
                      >is a powerful way to purge a list of objects by passing a Wildcard
                      expression. You can use the wildcard character (*) in path or query string
                      arguments.</template
                    >
                  </Card>
                </div>
              </div>
              <div class="flex flex-col sm:max-w-lg w-full gap-2">
                <label
                  for="id"
                  class="text-color text-base font-medium"
                  >Arguments</label
                >
                <PrimeTextarea
                  autoResize
                  rows="2"
                  cols="30"
                  :placeholder="placeholder"
                  :class="{ 'p-invalid': errors.argumentsPurge }"
                  v-bind="argumentsPurge"
                />
                <small
                  v-if="errors.argumentsPurge"
                  class="p-error text-xs font-normal leading-tight"
                  >{{ errors.argumentsPurge }}</small
                >

                <div class="text-color-secondary text-sm font-normal">
                  Tip: separate arguments using new line
                </div>
              </div>
            </template>
          </FormHorizontal>
        </template>
      </CreateFormBlock>
    </template>
  </ContentBlock>
</template>

<script setup>
  import CreateFormBlock from '@/templates/create-form-block-new'
  import FormHorizontal from '@/templates/create-form-block-new/form-horizontal'
  import RadioButton from 'primevue/radiobutton'
  import Card from 'primevue/card'
  import PrimeTextarea from 'primevue/textarea'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'

  import { useForm, useField } from 'vee-validate'
  import * as yup from 'yup'
  import { computed } from 'vue'

  const props = defineProps({
    createRealTimePurgeService: {
      type: Function,
      required: true
    }
  })

  const validationSchema = yup.object({
    layer: yup.string().required(),
    purge_type: yup.string().required(),
    argumentsPurge: yup.string().required('Arguments is a required field')
  })

  const { errors, defineInputBinds, meta, resetForm, values } = useForm({
    validationSchema,
    initialValues: {
      layer: 'edge_caching',
      purge_type: 'cachekey',
      argumentsPurge: ''
    }
  })

  const { value: layer } = useField('layer', { validateOnInput: true })
  const argumentsPurge = defineInputBinds('argumentsPurge', { validateOnInput: true })
  const { value: purge_type } = useField('purge_type', { validateOnInput: true })

  const placeholder = computed(() => {
    if (purge_type.value === 'cachekey') {
      return 'https://www.example.com.br/index.html'
    }
    if (purge_type.value === 'wildcard') {
      return 'www.example.com/*'
    }
    return 'www.example.com'
  })
</script>
