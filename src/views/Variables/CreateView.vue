<template>
  <CreateFormBlock
    pageTitle="Create Variables"
    :createService="props.createVariablesService"
    :formData="values"
    :isValid="meta.valid"
    :cleanFormCallback="resetForm"
  >
    <template #form>
      <form-horizontal
        title="Variables"
        description="Espaço livre para descrição e instruções de preenchimento. Esse conteúdo deve ser criado pensando tanto em funcionalidade quanto em em alinhamento e estética. Devemos sempre criar os blocos conforme o contexto, cuidando sempre para não ter blocos muito longos."
      >
        <template #inputs>
          <div class="flex flex-col gap-2">
            <label
              for="key"
              class="text-color text-base font-medium"
              >Key</label
            >
            <InputText
              placeholder="ex: GITHUB_API_KEY"
              v-bind="key"
              type="text"
              :class="{ 'p-invalid': errors.key }"
              class="max-w-lg w-full"
              v-tooltip.top="errors.key"
            />
          </div>
          <div class="flex flex-col gap-2">
            <label
              for="value"
              class="text-color text-base font-medium"
              >Value</label
            >
            <InputText
              placeholder="ex: MY_GITHUB_API_VALUE"
              v-bind="value"
              type="text"
              class="max-w-lg w-full"
              :class="{ 'p-invalid': errors.value }"
              v-tooltip.top="errors.value"
            />
          </div>
          <div class="flex gap-3 items-center">
            <div
              class="w-full max-w-3xl p-4 rounded-md border surface-border justify-start items-end gap-6 inline-flex"
            >
              <div class="grow shrink basis-0 flex-col justify-start items-start gap-1 inline-flex">
                <div class="self-stretch text-color text-base font-medium leading-normal">
                  Secret
                </div>
                <div class="self-stretch text-color-secondary text-sm font-normal">Description</div>
              </div>
              <div>
                <InputSwitch
                  v-bind="secret"
                  v-model="secret.value"
                  :class="{ 'p-invalid': errors.secret }"
                />
              </div>
            </div>
          </div>
        </template>
      </form-horizontal>
    </template>
  </CreateFormBlock>
</template>

<script setup>
  import CreateFormBlock from '@/templates/create-form-block'
  import formHorizontal from '@/templates/create-form-block/form-horizontal'
  import InputText from 'primevue/inputtext'
  import InputSwitch from 'primevue/inputswitch'
  import { useForm } from 'vee-validate'
  import * as yup from 'yup'

  const props = defineProps({
    createVariablesService: {
      type: Function,
      required: true
    }
  })
  //Validation Schema
  const validationSchema = yup.object({
    key: yup.string().required(),
    value: yup.string().required(),
    secret: yup.boolean().required().default(false)
  })

  // validation with VeeValidate
  const { errors, defineInputBinds, meta, resetForm, values } = useForm({
    validationSchema
  })

  const key = defineInputBinds('key', { validateOnInput: true })
  const value = defineInputBinds('value', { validateOnInput: true })
  const secret = defineInputBinds('secret')
</script>
