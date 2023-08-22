<template>
  <EditFormBlock  
    :pageTitle="'Edit Variable'"
    :editService="this.editVariableService"
    :loadService="this.loadVariableService"
    :initialDataSetter="setValues"
    :isValid="meta.valid"
    :formData="values"
  >
    <template #form>
      <InputText placeholder="ex: GITHUB_API_KEY" v-model="values.key"  v-bind="key" type="text"
        :class="{ 'p-invalid': errors.key }" v-tooltip.top="errors.key" />
      <InputText placeholder="ex: MY_GITHUB_API_VALUE" v-model="values.value" v-bind="value"  type="text"
        :class="{ 'p-invalid': errors.value }" v-tooltip.top="errors.value" />
      <div class="flex gap-3 items-center">
        <label for="">Secret</label>
        <InputSwitch v-bind="secret" v-model="secret.value"  :class="{ 'p-invalid': errors.secret }" />
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
  name:'edit-variable-view',
  components:{
    EditFormBlock,
    InputText,
    InputSwitch,
  },
  props: {
    loadVariableService: { type: Function, required: true },
    editVariableService: { type: Function, required: true }
  },
  data: () => {
    const validationSchema = yup.object({
        key: yup.string().required(),
        value: yup.string().required(),
        secret:yup.boolean().required().default(false),
    });
    const {errors,defineInputBinds,meta,values,setValues} = useForm({
      validationSchema,
    })

    const key = defineInputBinds('key',{validateOnInput:true})
    const value = defineInputBinds('value',{validateOnInput:true})
    const secret = defineInputBinds('secret')

    return{
      errors,
      meta,
      values,
      key,
      value,
      secret,
      setValues
    }
  },
}


</script>