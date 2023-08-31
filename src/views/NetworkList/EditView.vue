<template>
    <EditFormBlock  
      :pageTitle="'Edit Network Lists'"
      :editService="this.editNetworkListsService"
      :loadService="this.loadNetworkListsService"
      :initialDataSetter="setValues"
      :isValid="meta.valid"
      :formData="values"
    >
      <template #form>
        <div class="flex flex-col gap-2">
            <label for="name">Name:</label>
            <InputText placeholder="Add Network List Name"   v-bind="name" type="text"
              :class="{ 'p-invalid': errors.key }" v-tooltip.top="errors.key" />
        </div>
        <div class="flex flex-col gap-2">
            <label for="type">Type: </label>
            <Dropdown :class="{ 'p-invalid': errors.type }" v-model="listType.value" v-bind="listType" disabled :options="options"
            optionLabel="name" optionValue="value" class="w-full md:w-14rem" />
        </div>
        <div class="flex flex-col gap-2" v-if="listType.value === 'asn'">
        <label for="list">List: </label>
        <div class="card flex justify-content-center">
          <TextareaComponent :class="{ 'p-invalid': errors.ans }" v-bind="asn" rows="5" cols="75" id="list" placeholder="1234&#10;4321" />
        </div>
      </div>
      <div class="flex flex-col gap-2" v-if="listType.value === 'ip_cidr'">
        <label for="list">List: </label>
        <div class="card flex justify-content-center">
          <TextareaComponent 
            :class="{ 'p-invalid': errors.ipCidr }"
            v-bind="ipCidr"
            rows="5"
            id="ipCidr"
            cols="75"
            placeholder="192.168.0.1&#10;192.168.0.2/32&#10;10.1.1.10/16" />
        </div>
      </div>
      <div class="flex flex-col gap-2" v-if="listType.value === 'countries'">
        <label for="list">Countries: </label>
        <div class="card flex justify-content-center">
          <MultiSelect  
            v-model="selectedCountries"
            :options="countriesList"
            filter 
            optionLabel="name"
            optionValue="value" 
            placeholder="Select Countries"
            :class="{ 'p-invalid': errors.selectedCountries }"
            class="w-full"
          />
        </div>
      </div>
      </template>
    </EditFormBlock>
  </template>
  
  <script>
  import EditFormBlock from '@/templates/edit-form-block'
  import InputText from 'primevue/inputtext';
  import Dropdown from 'primevue/dropdown'
  import MultiSelect from 'primevue/multiselect';
  import TextareaComponent from 'primevue/textarea';
  import { useForm, useField } from 'vee-validate';
  import * as yup from 'yup';
  import { ref, onMounted, watch } from 'vue';
  
  export default {
    name:'edit-network-lists-view',
    components:{
      EditFormBlock,
      InputText,
      Dropdown,
      MultiSelect,
      TextareaComponent,
    },
    props: {
      loadNetworkListsService: { type: Function, required: true },
      editNetworkListsService: { type: Function, required: true },
      listCountriesService: { type: Function, required: true},
    },
    data: (props) => {
      const options = ref([
          { name: 'ASN', value: 'asn' },
          { name: 'Countries', value: 'countries' },
          { name: 'IP/CIDR', value: 'ip_cidr' }
      ])
      const validationSchema = yup.object({
      name: yup.string().required(),
      networkListType: yup.string().oneOf(options.value.map(option => option.value)),
      selectedCountries:yup.array().when('networkListType',{
        is:'countries',
        then:(schema)=>schema.required().min(1)
      }),
      ipCidr: yup.string().when('networkListType', {
        is: 'ip_cidr',
        then: (schema) => schema.required()
      }),
      asn: yup.string().when('networkListType', {
        is: 'asn',
        then: (schema) => schema.required()
      }),
    })
    
      const {errors,defineInputBinds,meta,values,setValues} = useForm({
        validationSchema
      })
      const countriesList = ref('')
      const fetchCountries = async () => {
        const result = await props.listCountriesService();
        countriesList.value = result
      }
      const name = defineInputBinds('name',{validateOnInput:true})
      const listType = defineInputBinds('listType',{validateOnInput:true})
      const ipCidr = defineInputBinds('itemsValues',{validateOnInput:true})
      const selectedCountries = defineInputBinds('itemsValues',{validateOnInput:true})
      const asn = defineInputBinds('itemsValues',{validateOnInput:true})
      const { value: networkContentList, setValue: setNetworkContentList } = useField('networkContentList')
      onMounted(async () => {
      await fetchCountries()
    })
    watch([name,listType,selectedCountries,ipCidr,asn], () => {
      switch (listType.value.value) {
      case 'countries':
          setNetworkContentList(selectedCountries.value)
          break;
      case 'ip_cidr':
          setNetworkContentList(ipCidr.value.value.trim().split(','))
          break;
      case 'asn':
          setNetworkContentList(asn.value.value.trim().split(','))
          break;
      default:
          setNetworkContentList('')
          break;
      }
    })


    
  
      return{
        errors,
        meta,
        values,
        name,
        listType,
        setValues,
        options,
        countriesList,
        selectedCountries,
        networkContentList,
        ipCidr,
        asn,
      }
    },
  }
  
  
  </script>