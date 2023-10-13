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
          <Card :pt="styleCardSimple">
            <template #title>
              <span class="text-base">Secret</span>
              <InputSwitch
                v-bind="secret"
                v-model="secret.value"
                :class="{ 'p-invalid': errors.secret }"
              />
            </template>
            <template #subtitle> Description </template>
          </Card>
        </template>
      </form-horizontal>
    </template>
  </CreateFormBlock>
</template>

<script setup>
  import { ref } from 'vue'
  import CreateFormBlock from '@/templates/create-form-block'
  import formHorizontal from '@/templates/create-form-block/form-horizontal'
  import InputText from 'primevue/inputtext'
  import InputSwitch from 'primevue/inputswitch'
  import Card from 'primevue/card'

  import { useForm } from 'vee-validate'
  import * as yup from 'yup'

  const props = defineProps({
    createVariablesService: {
      type: Function,
      required: true
    }
  })
  const styleCardSimple = ref({
    body: { class: 'p-4' },
    title: { class: 'flex justify-between items-cente text-base m-0' },
    subtitle: { class: 'text-sm font-normal text-color-secondary m-0' }
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
