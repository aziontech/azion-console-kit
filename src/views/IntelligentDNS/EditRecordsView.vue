<template>
  <EditFormBlock
    pageTitle="Edit Intelligent DNS Record"
    :editService="editRecordServiceWithIDNSIdDecorator"
    :loadService="loadRecordServiceWithIDNSIdDecorator"
    :initialDataSetter="setValues"
    :isValid="meta.valid"
    :formData="values"
    :formMeta="meta"
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
            <div class="p-inputgroup">
              <InputText
                v-bind="name"
                id="name"
                type="text"
                :class="{ 'p-invalid': errors.name }"
                v-tooltip.top="{ value: errors.name, showDelay: 200 }"
              />
              <span class="p-inputgroup-addon"> .{{ intelligentDNSStore.getDomain }} </span>
            </div>

            <small
              v-if="errors.name"
              class="p-error text-xs font-normal leading-tight"
              >{{ errors.name }}</small
            >
          </div>
          <div class="flex flex-col sm:max-w-lg w-full gap-2">
            <label
              for="type"
              class="text-color text-base font-medium"
              >Record Type *</label
            >
            <Dropdown
              v-model="recordType"
              :options="recordsTypes"
              optionLabel="label"
              id="type"
              optionValue="value"
              placeholder="Select a Record Type"
              :class="{ 'p-invalid': errors.type }"
              class="w-full"
            />
            <small
              v-if="errors.type"
              class="p-error text-xs font-normal leading-tight"
              >{{ errors.type }}</small
            >
          </div>
          <div class="flex flex-col sm:max-w-lg w-full gap-2">
            <label
              for="value"
              class="text-color text-base font-medium"
              >Value *</label
            >
            <Textarea
              rows="5"
              cols="30"
              placeholder="Value"
              v-bind="value"
              id="value"
              type="text"
              :class="{ 'p-invalid': errors.value }"
              v-tooltip.top="{ value: errors.value, showDelay: 200 }"
            />
            <small
              v-if="errors.value"
              class="p-error text-xs font-normal leading-tight"
              >{{ errors.value }}</small
            >
          </div>
          <div class="flex flex-col sm:max-w-lg w-full gap-2">
            <label
              for="ttl"
              class="text-color text-base font-medium"
              >TTL *</label
            >
            <InputText
              placeholder="TTL (seconds):"
              v-bind="ttl"
              id="ttl"
              type="number"
              :class="{ 'p-invalid': errors.ttl }"
              v-tooltip.top="{ value: errors.ttl, showDelay: 200 }"
            />
            <small
              v-if="errors.ttl"
              class="p-error text-xs font-normal leading-tight"
              >{{ errors.ttl }}</small
            >
          </div>

          <div class="flex flex-col sm:max-w-lg w-full gap-2">
            <label
              for="policy"
              class="text-color text-base font-medium"
              >Policy *</label
            >
            <Dropdown
              v-model="policy"
              :options="policyList"
              id="policy"
              optionLabel="label"
              optionValue="value"
              placeholder="Select a Policy"
              :class="{ 'p-invalid': errors.policy }"
              class="w-full"
            />
            <small
              v-if="errors.policy"
              class="p-error text-xs font-normal leading-tight"
              >{{ errors.policy }}</small
            >
          </div>
          <div
            class="flex flex-col sm:max-w-lg w-full gap-2"
            v-if="isWeightedPolicy"
          >
            <label
              for="weight"
              class="text-color text-base font-medium"
              >Weight *</label
            >
            <InputText
              placeholder="Weight"
              v-bind="weight"
              id="weight"
              type="number"
              min="0"
              max="255"
              :class="{ 'p-invalid': errors.weight }"
              v-tooltip.top="{ value: errors.weight, showDelay: 200 }"
              v-if="isWeightedPolicy"
            />
            <small
              v-if="errors.weight"
              class="p-error text-xs font-normal leading-tight"
              >{{ errors.weight }}</small
            >
          </div>

          <div
            class="flex flex-col sm:max-w-lg w-full gap-2"
            v-if="isWeightedPolicy"
          >
            <label
              for="description"
              class="text-color text-base font-medium"
              >Description</label
            >
            <InputText
              placeholder="add the description"
              v-bind="description"
              type="text"
              :class="{ 'p-invalid': errors.description }"
              v-tooltip.top="{ value: errors.description, showDelay: 200 }"
              v-if="isWeightedPolicy"
            />
            <small
              v-if="errors.description"
              class="p-error text-xs font-normal leading-tight"
              >{{ errors.description }}</small
            >
          </div>
        </template>
      </FormHorizontal>
    </template>
  </EditFormBlock>
</template>

<script setup>
  import { ref, watch } from 'vue'
  import { useRoute } from 'vue-router'
  import { useIntelligentDNSStore } from '@/stores/intelligent-dns'
  import EditFormBlock from '@templates/edit-form-block-new'
  import FormHorizontal from '@templates/create-form-block-new/form-horizontal'
  import InputText from 'primevue/inputtext'
  import Textarea from 'primevue/textarea'
  import Dropdown from 'primevue/dropdown'
  import { useForm, useField } from 'vee-validate'
  import * as yup from 'yup'
  import router from '@/router'

  const props = defineProps({
    editRecordsService: {
      type: Function,
      required: true
    },
    loadRecordsService: {
      type: Function,
      required: true
    }
  })

  const route = useRoute()
  const intelligentDNSStore = useIntelligentDNSStore()

  const recordsTypes = ref([
    { label: 'A - IPv4 Address', value: 'A' },
    { label: 'AAAA - IPv6 Address', value: 'AAAA' },
    { label: 'ANAME - Maps a name to another name', value: 'ANAME' },
    { label: 'CAA - Certification Authority Authorization', value: 'CAA' },
    { label: 'CNAME - Canonical name', value: 'CNAME' },
    { label: 'DS - Delegation Signer', value: 'DS' },
    { label: 'MX - Mail exchange', value: 'MX' },
    { label: 'NS - Name Servers', value: 'NS' },
    { label: 'PTR - Reverse DNS lookup', value: 'PTR' },
    { label: 'SRV - Location of server or service', value: 'SRV' },
    { label: 'TXT - Text', value: 'TXT' }
  ])

  const policyList = ref([
    { label: 'Simple', value: 'simple' },
    { label: 'Weighted', value: 'weighted' }
  ])

  const validationSchema = yup.object({
    name: yup.string().required(),
    recordType: yup.string().required('Please select an option'),
    value: yup.string().required(),
    ttl: yup.number().required(),
    policy: yup.string().required('Please select an option'),
    weight: yup.number().when('policy', {
      is: 'weighted',
      then: (schema) => schema.required('Weighted is a required field').min(1).max(255)
    }),
    description: yup.string()
  })

  const { errors, defineInputBinds, meta, values, setValues } = useForm({
    validationSchema,
    initialValues: {
      intelligentDNSId: router.currentRoute.value.params.intelligentDNSId
    }
  })

  const name = defineInputBinds('name', { validateOnInput: true })
  const { value: recordType } = useField('recordType')
  const { value: policy } = useField('policy')
  const value = defineInputBinds('value', { validateOnInput: true })
  const ttl = defineInputBinds('ttl', { validateOnInput: true })
  const weight = defineInputBinds('weight', { validateOnInput: true })
  const description = defineInputBinds('description', { validateOnInput: true })

  let isWeightedPolicy = false

  watch([recordType, policy, values], () => {
    isWeightedPolicy = policy.value === 'weighted'
  })

  async function loadRecordServiceWithIDNSIdDecorator(payload) {
    const intelligentDNSId = route.params.intelligentDNSId
    return await props.loadRecordsService({ id: payload.id, intelligentDNSId })
  }

  async function editRecordServiceWithIDNSIdDecorator(payload) {
    const intelligentDNSId = route.params.intelligentDNSId
    return await props.editRecordsService({ intelligentDNSId, ...payload })
  }
</script>
