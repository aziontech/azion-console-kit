<template>
  <CreateFormBlock
    pageTitle="Create Edge Service"
    :createService="props.createEdgeService"
    :formData="values"
    :isValid="meta.valid"
    :formMeta="meta"
    :cleanFormCallback="resetForm"
  >
    <template #form>
      <FormHorizontal
        title="Edge Service"
        description="Espaço livre para descrição e instruções de preenchimento. Esse conteúdo deve ser criado pensando tanto em funcionalidade quanto em em alinhamento e estética. Devemos sempre criar os blocos conforme o contexto, cuidando sempre para não ter blocos muito longos."
      >
        <template #inputs>
          <div class="flex flex-col sm:max-w-lg w-full gap-2">
            <label
              for="name"
              class="text-color text-base font-medium"
              >Name *</label
            >
            <InputText
              placeholder="ex: X Edge Service "
              v-bind="name"
              type="text"
              :class="{ 'p-invalid': errors.name }"
              v-tooltip.top="{ value: errors.name, showDelay: 200 }"
            />
            <small
              v-if="errors.name"
              class="p-error text-xs font-normal leading-tight"
              >{{ errors.name }}</small
            >
          </div>
        </template>
      </FormHorizontal>
    </template>
  </CreateFormBlock>
</template>

<script setup>
  import CreateFormBlock from '@/templates/create-form-block-new'
  import FormHorizontal from '@/templates/create-form-block-new/form-horizontal'
  import InputText from 'primevue/inputtext'

  import { useForm } from 'vee-validate'
  import * as yup from 'yup'

  const props = defineProps({
    createEdgeService: {
      type: Function,
      required: true
    }
  })
  const validationSchema = yup.object({
    name: yup.string().required()
  })
  const { errors, defineInputBinds, meta, resetForm, values } = useForm({
    validationSchema
  })
  const name = defineInputBinds('name', { validateOnInput: true })
</script>
