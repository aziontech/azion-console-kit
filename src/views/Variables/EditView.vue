<template>
  <EditFormBlock
    pageTitle="Edit Variable"
    :editService="this.editVariableService"
    :loadService="this.loadVariableService"
    :initialDataSetter="setValues"
    :isValid="meta.valid"
    :formData="values"
  >
    <template #form>
      <form-horizontal
        title="Variables"
        description="Espaço livre para descrição e instruções de preenchimento. Esse conteúdo deve ser criado pensando tanto em funcionalidade quanto em em alinhamento e estética. Devemos sempre criar os blocos conforme o contexto, cuidando sempre para não ter blocos muito longos."
      >
        <template #inputs>
          <div class="flex flex-col sm:max-w-lg w-full gap-2">
            <label
              for="name"
              class="text-color text-base font-medium"
              >Key</label
            >
            <InputText
              placeholder="ex: GITHUB_API_KEY"
              v-bind="key"
              type="text"
              id="name"
              :class="{ 'p-invalid': errors.key }"
              v-tooltip.top="{ value: errors.key, showDelay: 200 }"
            />
          </div>

          <div class="flex flex-col sm:max-w-lg w-full gap-2">
            <label
              for="Value"
              class="text-color text-base font-medium"
              >Value</label
            >
            <InputText
              placeholder="ex: MY_GITHUB_API_VALUE"
              v-bind="value"
              type="text"
              :class="{ 'p-invalid': errors.value }"
              v-tooltip.top="{ value: errors.value, showDelay: 200 }"
            />
          </div>

          <Card
            :pt="{
              body: { class: 'p-4' },
              title: { class: 'flex justify-between items-cente text-base m-0 font-medium' },
              subtitle: { class: 'text-sm font-normal text-color-secondary m-0 pr-0 md:pr-[2.5rem]' }
            }"
          >
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
  </EditFormBlock>
</template>

<script>
  import EditFormBlock from '@/templates/edit-form-block-new'
  import formHorizontal from '@/templates/create-form-block-new/form-horizontal'
  import InputText from 'primevue/inputtext'
  import InputSwitch from 'primevue/inputswitch'
  import Card from 'primevue/card'
  import { useForm } from 'vee-validate'
  import * as yup from 'yup'

  export default {
    name: 'edit-variable-view',
    components: {
      EditFormBlock,
      InputText,
      InputSwitch,
      Card,
      formHorizontal
    },
    props: {
      loadVariableService: { type: Function, required: true },
      editVariableService: { type: Function, required: true }
    },
    data: () => {
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

      return {
        errors,
        meta,
        values,
        key,
        value,
        secret,
        setValues
      }
    }
  }
</script>
