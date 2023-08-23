<template>
    <EditFormBlock  
      :pageTitle="'Edit Intelligent DNS'"
      :editService="this.editIntelligentDNSService"
      :loadService="this.loadIntelligentDNSService"
      :initialDataSetter="setValues"
      :isValid="meta.valid"
      :formData="values"
    >
      <template #form>
        <InputText
          placeholder="Zone Name"
          v-bind="name" type="text" :class="{ 'p-invalid': errors.name }" 
          v-tooltip.top="errors.name"
        />
        <InputText
          placeholder="Domain"
          v-bind="domain"
          type="text" 
          :class="{ 'p-invalid': errors.domain }"
          v-tooltip.top="errors.domain"
        />
        <div class="flex gap-3 items-center">
          <label for="">Is Active</label>
          <InputSwitch v-bind="isActive"  v-model="isActive.value"  :class="{ 'p-invalid': errors.isActive }"/>
        </div>
      </template>
    </EditFormBlock>
  </template>
  
  <script>
  import EditFormBlock from '@/templates/edit-form-block'
  import InputText from 'primevue/inputtext';
  import InputSwitch from 'primevue/inputswitch';
  import { useForm } from 'vee-validate';
  import * as yup from 'yup';
  
  export default {
    name:'edit-intelligent-dns-view',
    components: {
      EditFormBlock,
      InputText,
      InputSwitch,
    },

    props: {
      loadIntelligentDNSService: { type: Function, required: true },
      editIntelligentDNSService: { type: Function, required: true }
    },

    data: () => {
      const validationSchema = yup.object({
          name: yup.string().required(),
          domain: yup.string().required(),
          isActive: yup.boolean().required().default(false),
      });

      const { errors, defineInputBinds, meta, values, setValues } = useForm({
        validationSchema,
      })
  
      const name = defineInputBinds('name', { validateOnInput: true })
      const domain = defineInputBinds('domain', { validateOnInput: true })
      const isActive = defineInputBinds('isActive')
  
      return {
        errors,
        meta,
        values,
        name,
        domain,
        isActive,
        setValues
      }
    },
  }
  
  
  </script>