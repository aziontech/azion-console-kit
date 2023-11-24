<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Create Variables" />
    </template>
    <template #content>
      <CreateFormBlock
        :createService="props.createVariablesService"
        :formData="values"
        :formMeta="meta"
        :isValid="meta.valid"
        :cleanFormCallback="resetForm"
      >
        <template #form>
          <FormHorizontal
            title="Variables"
            description="Create environment variables or secrets to use with configured edge functions."
          >
            <template #inputs>
              <div class="flex flex-col sm:max-w-lg w-full gap-2">
                <label
                  for="key"
                  class="text-color text-base font-medium"
                  >Key *</label
                >
                <InputText
                  placeholder="GITHUB_API_KEY"
                  v-bind="key"
                  type="text"
                  id="key"
                  :class="{ 'p-invalid': errors.key }"
                />
                <small
                  v-if="errors.key"
                  class="p-error text-xs font-normal leading-tight"
                  >{{ errors.key }}</small
                >
              </div>

              <div class="flex flex-col sm:max-w-lg w-full gap-2">
                <label
                  for="value"
                  class="text-color text-base font-medium"
                  >Value *</label
                >
                <InputText
                  placeholder="MY_GITHUB_API_VALUE"
                  v-bind="value"
                  id="value"
                  type="text"
                  :class="{ 'p-invalid': errors.value }"
                />
                <small
                  v-if="errors.value"
                  class="p-error text-xs font-normal leading-tight"
                  >{{ errors.value }}</small
                >
              </div>
              <div class="flex gap-3 items-center">
                <InputSwitch
                  id="secret"
                  v-bind="secret"
                  v-model="secret.value"
                  :class="{ 'p-invalid': errors.secret }"
                />
                <label for="secret">Secret</label>
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
  import InputText from 'primevue/inputtext'
  import InputSwitch from 'primevue/inputswitch'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'

  import { useForm } from 'vee-validate'
  import * as yup from 'yup'

  const props = defineProps({
    createVariablesService: {
      type: Function,
      required: true
    }
  })

  const validationSchema = yup.object({
    key: yup.string().required(),
    value: yup.string().required(),
    secret: yup.boolean().required().default(false)
  })

  const { errors, defineInputBinds, meta, resetForm, values } = useForm({
    validationSchema
  })

  const key = defineInputBinds('key', { validateOnInput: true })
  const value = defineInputBinds('value', { validateOnInput: true })
  const secret = defineInputBinds('secret')
</script>
