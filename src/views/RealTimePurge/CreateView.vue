<template>
  <CreateFormBlock
    pageTitle="Create Real-Time Purge"
    :createService="props.createVariablesService"
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
                    inputId="label"
                    name="label"
                    value="label08"
                    v-bind="layer"
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
                    inputId="label"
                    name="label"
                    value="label07"
                    v-bind="layer"
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
                    inputId="label"
                    name="label"
                    value="label08"
                    v-bind="purge_type"
                  />
                </template>
                <template #subtitle
                  >is the most accurate way to purge your content cache by passing a cache key list
                  of up to 50 objects per request.</template
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
                    inputId="label"
                    name="label"
                    value="label07"
                    v-bind="purge_type"
                  />
                </template>
                <template #subtitle>
                  is the simplest way to purge your content cache by passing a URL list of up to 50
                  objects per request. You cannot purge content cache variations with this
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
                    inputId="label"
                    name="label"
                    value="label07"
                    v-bind="purge_type"
                  />
                </template>
                <template #subtitle
                  >is a powerful way to purge a list of objects by passing a Wildcard expression.
                  You can use the wildcard character (*) in path or query string
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
              :class="{ 'p-invalid': errors.argumentsPurge }"
              v-model="argumentsPurge"
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

<script setup>
  import CreateFormBlock from '@/templates/create-form-block-new'
  import FormHorizontal from '@/templates/create-form-block-new/form-horizontal'
  import RadioButton from 'primevue/radiobutton'
  import Card from 'primevue/card'
  import PrimeTextarea from 'primevue/textarea'

  import { useForm, useField } from 'vee-validate'
  import * as yup from 'yup'

  const props = defineProps({
    createVariablesService: {
      type: Function,
      required: true
    }
  })

  const validationSchema = yup.object({
    layer: yup.string().required(),
    purge_type: yup.string().required(),
    argumentsPurge: yup.string().required()
  })

  const { errors, defineInputBinds, meta, resetForm, values } = useForm({
    validationSchema
  })

  const layer = defineInputBinds('layer', { validateOnInput: true })
  const purge_type = defineInputBinds('purge_type', { validateOnInput: true })
  const { value: argumentsPurge } = useField('argumentsPurge', { validateOnInput: true })
</script>
