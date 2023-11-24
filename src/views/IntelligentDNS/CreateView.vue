<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Create Intelligent DNS"></PageHeadingBlock>
    </template>
    <template #content>
      <CreateFormBlock
        :createService="props.createIntelligentDNSService"
        :formData="values"
        :formMeta="meta"
        :cleanFormCallback="resetForm"
      >
        <template #form>
          <FormHorizontal
            title="General"
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
                  placeholder="Zone Name"
                  v-bind="name"
                  id="name"
                  type="text"
                  :class="{ 'p-invalid': errors.name }"
                />
                <small
                  v-if="errors.name"
                  class="p-error text-xs font-normal leading-tight"
                  >{{ errors.name }}</small
                >
              </div>
              <div class="flex flex-col sm:max-w-lg w-full gap-2">
                <label
                  for="domain"
                  class="text-color text-base font-medium"
                  >Domain *</label
                >
                <InputText
                  placeholder="Domain"
                  id="domain"
                  v-bind="domain"
                  type="text"
                  :class="{ 'p-invalid': errors.domain }"
                />
                <small
                  v-if="errors.domain"
                  class="p-error text-xs font-normal leading-tight"
                  >{{ errors.domain }}</small
                >
              </div>
              <div class="flex gap-3 items-center">
                <label for="">Active</label>
                <InputSwitch
                  v-bind="isActive"
                  v-model="isActive.value"
                  :class="{ 'p-invalid': errors.isActive }"
                />
              </div>
            </template>
          </FormHorizontal>
        </template>
      </CreateFormBlock>
    </template>
  </ContentBlock>
</template>

<script setup>
  import CreateFormBlock from '@templates/create-form-block-new'
  import FormHorizontal from '@templates/create-form-block-new/form-horizontal'
  import InputText from 'primevue/inputtext'
  import InputSwitch from 'primevue/inputswitch'
  import { useForm } from 'vee-validate'
  import * as yup from 'yup'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'

  const props = defineProps({
    createIntelligentDNSService: {
      type: Function,
      required: true
    }
  })

  //Validation Schema
  const validationSchema = yup.object({
    name: yup.string().required(),
    domain: yup
      .string()
      .required()
      .test('valid-domain', 'Invalid domain', function (value) {
        const domainRegex = /^(?:[-A-Za-z0-9]+\.)+[A-Za-z]{2,6}$/
        return domainRegex.test(value)
      }),
    isActive: yup.boolean().required().default(false)
  })

  // validation with VeeValidate
  const { errors, defineInputBinds, meta, resetForm, values } = useForm({
    validationSchema,
    initialValues: {
      isActive: false
    }
  })

  const name = defineInputBinds('name', { validateOnInput: true })
  const domain = defineInputBinds('domain', { validateOnInput: true })
  const isActive = defineInputBinds('isActive')
</script>
