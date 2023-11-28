<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        pageTitle="Create Intelligent DNS"
        description="Copy the Nameservers values for change your domain's authoritative DNS servers to use Azion Intelligent DNS."
      >
        <template #default>
          <PrimeButton
            outlined
            icon="pi pi-copy"
            class="max-md:w-full"
            label="Copy Nameservers"
            @click="handleCopyNameServers"
          ></PrimeButton>
        </template>
      </PageHeadingBlock>
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
            description="Description"
          >
            <template #inputs>
              <div class="flex flex-col sm:max-w-lg w-full gap-2">
                <label
                  for="name"
                  class="text-color text-base font-medium"
                  >Name *</label
                >
                <InputText
                  v-model="name"
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
            </template>
          </FormHorizontal>
          <FormHorizontal
            title="Title Section"
            description="Description"
          >
            <template #inputs>
              <div class="flex flex-col sm:max-w-lg w-full gap-2">
                <label
                  for="domain"
                  class="text-color text-base font-medium"
                  >Domain *</label
                >
                <InputText
                  id="domain"
                  v-model="domain"
                  type="text"
                  :class="{ 'p-invalid': errors.domain }"
                />
                <small
                  v-if="errors.domain"
                  class="p-error text-xs font-normal leading-tight"
                  >{{ errors.domain }}</small
                >
              </div>
            </template>
          </FormHorizontal>
          <FormHorizontal
            title="Status"
            description="Description"
          >
            <template #inputs>
              <div class="flex gap-3 items-center">
                <label for="">Active</label>
                <InputSwitch
                  v-model="isActive"
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
  import CreateFormBlock from '@templates/create-form-block'
  import FormHorizontal from '@templates/create-form-block/form-horizontal'
  import InputText from 'primevue/inputtext'
  import InputSwitch from 'primevue/inputswitch'
  import { useForm, useField } from 'vee-validate'
  import * as yup from 'yup'
  import PrimeButton from 'primevue/button'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { useToast } from 'primevue/usetoast'

  const props = defineProps({
    createIntelligentDNSService: {
      type: Function,
      required: true
    },
    clipboardWrite: {
      type: Function,
      required: true
    }
  })
  const toast = useToast()

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
    isActive: yup.boolean()
  })

  // validation with VeeValidate
  const { errors, meta, resetForm, values } = useForm({
    validationSchema,
    initialValues: {
      isActive: true
    }
  })

  const { value: name } = useField('name')
  const { value: domain } = useField('domain')
  const { value: isActive } = useField('isActive')

  const handleCopyNameServers = () => {
    props.clipboardWrite('ns1.aziondns.net;ns2.aziondns.com;ns3.aziondns.org')
    toast.add({
      closable: false,
      severity: 'success',
      summary: 'Nameservers copied',
      life: 10000
    })
  }
</script>
