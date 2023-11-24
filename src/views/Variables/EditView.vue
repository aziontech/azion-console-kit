<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Edit Variable" />
    </template>
    <template #content>
      <EditFormBlock
        :editService="props.editVariableService"
        :loadService="props.loadVariableService"
        :initialDataSetter="setValues"
        :formMeta="meta"
        :formData="values"
        :updatedRedirect="updatedRedirect"
      >
        <template #form>
          <FormHorizontal
            title="Variables"
            description="Edit an environment variable or secret to use with configured edge functions."
          >
            <template #inputs>
              <div class="flex flex-col sm:max-w-lg w-full gap-2">
                <label
                  for="name"
                  class="text-color text-base font-medium"
                  >Key *</label
                >
                <InputText
                  placeholder="GITHUB_API_KEY"
                  v-bind="key"
                  type="text"
                  id="name"
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
                  for="Value"
                  class="text-color text-base font-medium"
                  >Value *</label
                >
                <InputText
                  placeholder="MY_GITHUB_API_VALUE"
                  v-bind="value"
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
      </EditFormBlock>
    </template>
  </ContentBlock>
</template>

<script setup>
  import EditFormBlock from '@/templates/edit-form-block-new'
  import FormHorizontal from '@/templates/create-form-block-new/form-horizontal'
  import InputText from 'primevue/inputtext'
  import InputSwitch from 'primevue/inputswitch'
  import { useForm } from 'vee-validate'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'

  import * as yup from 'yup'

  const props = defineProps({
    loadVariableService: { type: Function, required: true },
    editVariableService: { type: Function, required: true },
    updatedRedirect: { type: String, required: true }
  })

  const validationSchema = yup.object({
    key: yup.string().required(),
    value: yup.string().required(),
    secret: yup.boolean().required().default(false)
  })

  const { errors, defineInputBinds, meta, values, setValues } = useForm({
    validationSchema
  })

  const key = defineInputBinds('key', { validateOnInput: true })
  const value = defineInputBinds('value', { validateOnInput: true })
  const secret = defineInputBinds('secret')
</script>
