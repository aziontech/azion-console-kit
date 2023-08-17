<template>
  <CreateFormBlock 
    :pageTitle="'Create Variables'"
    :createService="props.createVariablesService"
    :isValid="meta.valid"
    :cleanFormCallback="resetForm"
  >
    <template #form>
        <InputText
          placeholder="ex: GITHUB_API_KEY"
          v-bind="key"   type="text" :class="{ 'p-invalid': errors.key }" 
          v-tooltip.top="errors.key"
        />
        <InputText
          placeholder="ex: MY_GITHUB_API_VALUE"
          v-bind="value"
          type="text" 
          :class="{ 'p-invalid': errors.value }"
          v-tooltip.top="errors.value"
        />
    </template>
  </CreateFormBlock>
</template>

<script setup>
import CreateFormBlock from '@/templates/create-form-block'
import InputText from 'primevue/inputtext';
import { useForm } from 'vee-validate';
import {defineProps} from 'vue'
import * as yup from 'yup';

const props = defineProps(['createVariablesService'])
//Validation Schema
const validationSchema = yup.object({
    key: yup.string().required(),
    value: yup.string().required(),
});

// validation with VeeValidate
const {errors,defineInputBinds,meta,resetForm} = useForm({
  validationSchema,
})

const key = defineInputBinds('key',{validateOnInput:true})
const value = defineInputBinds('value',{validateOnInput:true})

</script>