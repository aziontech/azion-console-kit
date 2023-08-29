<template>
  <CreateFormBlock 
    :pageTitle="'Create Intelligent DNS'"
    :createService="props.createRecordsService"
    :formData="values"
    :isValid="meta.valid"
    :cleanFormCallback="resetForm"
  >
    <template #form>
      <div class="flex items-end gap-2">
        <InputText
          placeholder="Name"
          v-bind="name" type="text" :class="{ 'p-invalid': errors.name }" 
          v-tooltip.top="errors.name"
        />
        <label for="youdomain">.youdomain.com</label>
      </div>

      <div class="card flex justify-content-center">
        <Dropdown
          v-model="type"
          :options="recordsTypes"
          optionLabel="record type"
          placeholder="Select a Record Type"
          :class="{ 'p-invalid': errors.type }"
          class="w-full md:w-14rem"
        />
      </div>
    </template>
</CreateFormBlock>
</template>

<script setup>
import { ref } from "vue";
import CreateFormBlock from '@/templates/create-form-block'
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import { useForm } from 'vee-validate';
import * as yup from 'yup';

const props = defineProps({
  'createIntelligentDNSService': {
    type: Function,
    required: true,
  }
})

const recordsTypes = ref([
    { name: 'A - IPv4 Address', value: 'A' },
    { name: 'AAAA - IPv6 Address', value: 'AAAA' },
    { name: 'ANAME - Maps a name to another name', value: 'ANAME' },
    { name: 'CAA - Certification Authority Authorization', value: 'CAA' },
    { name: 'CNAME - Canonical name', value: 'CNAME' },
    { name: 'DS - Delegation Signer', value: 'DS' },
    { name: 'MX - Mail exchange', value: 'MX' },
    { name: 'NS - Name Servers', value: 'NS' },
    { name: 'PTR - Reverse DNS lookup', value: 'PTR' },
    { name: 'SRV - Location of server or service', value: 'SRV' },
    { name: 'TXT - Text', value: 'TXT' },
]);

//Validation Schema
const validationSchema = yup.object({
  name: yup.string().required(),
  type: yup.string().required(),
});

// validation with VeeValidate
const { errors, defineInputBinds, meta, resetForm, values } = useForm({
  validationSchema,
  initialValues: {
    type: 'A'
  }
})

const name = defineInputBinds('name', { validateOnInput: true })
const type = defineInputBinds('type', { validateOnInput: true })
</script>