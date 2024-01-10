<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal.vue'
  import Divider from 'primevue/divider'
  import Dropdown from 'primevue/dropdown'
  import { STATUS_CODE_OPTIONS } from './StatusCodeOptions'
  import InputNumber from 'primevue/inputnumber'
  import PrimeButton from 'primevue/button'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import { onMounted, ref } from 'vue'
  import InputText from 'primevue/inputtext'
  import { useField, useFieldArray } from 'vee-validate'

  const props = defineProps({
    listOriginsService: {
      type: Function,
      required: true
    },
    edgeApplicationId: {
      type: String,
      required: true
    }
  })

  const { value: originId } = useField('originId')
  const {
    push: pushErrorResponse,
    remove: removeErrorResponse,
    fields: errorResponses
  } = useFieldArray('errorResponses')

  const defaultErrorResponse = {
    code: '',
    timeout: 0,
    uri: null,
    customStatusCode: ''
  }  

  const addErrorResponse = () => {
    pushErrorResponse({ ...defaultErrorResponse })
  }

  const originOptions = ref('')

  const getOrigins = async () => {
    originOptions.value = await props.listOriginsService({ id: props.edgeApplicationId })
  }

  onMounted(async () => {
    await getOrigins()
  })

</script>

<template>
  <FormHorizontal
    title="Error Responses List"
    description="Time to cache error responses before retry request to your origin."
  >
    <template #inputs v-if="errorResponses.length > 0">
        <Divider
          align="left"
          type="dashed"
        >
          <b>Then</b>
        </Divider>
        <div class="flex flex-wrap gap-6">
          <div class="flex flex-col w-full sm:max-w-xs gap-2">
            <label class="text-color text-sm font-medium leading-5">Status Code *</label>
            <span class="p-input-icon-right w-full flex max-w-lg flex-col items-start gap-2">
              <i
                class="pi pi-lock text-color-secondary"
              />
              <InputText
                class="w-full"
                value="Any (Default)"
                type="text"
                :disabled="true"
              />
            </span>
          </div>
          <div class="flex flex-col w-full sm:max-w-xs gap-2">
            <label
              for="maximun-ttl-seconds"
              class="text-color text-base font-medium"
            >
              Error Caching TTL*
            </label>
            <InputNumber
              v-model="errorResponses[0].value.timeout"
              showButtons
            />
          </div>
        </div>

        <div v-for="(errorResponse, index) in errorResponses" :key="index" :class="index === 0? 'hidden':''">
          <div class="flex flex-col gap-6">         
            <div class="flex">
              <Divider
                align="left"
                type="dashed"
              >
                <b>And</b> 
              </Divider>
              <PrimeButton 
                @click="removeErrorResponse(index)"
                outlined
                icon="pi pi-trash"
              />
            </div>   

            <div class="flex flex-wrap gap-6">
              <div class="flex flex-col w-full sm:max-w-xs gap-2">
                <label class="text-color text-sm font-medium leading-5">Status Code *</label>
                <Dropdown
                  v-model="errorResponse.value.code"
                  :options="STATUS_CODE_OPTIONS"
                  optionLabel="name"
                  option-value="code"
                />
              </div>
              <div class="flex flex-col w-full sm:max-w-xs gap-2">
                <label
                  for="maximun-ttl-seconds"
                  class="text-color text-base font-medium"
                >
                  Error Caching TTL*
                </label>
                <InputNumber
                  v-model="errorResponse.value.timeout"
                  showButtons
                />
              </div>
            </div>
            <div class="flex flex-col sm:max-w-lg w-full gap-2">
              <FieldText
                label="URL path"
                placeholder="/example.com/path/error-page.txt"
                :name="`errorResponses[${index}].uri`"
                :value="errorResponse.value.uri"
                description="Add a path to an error page created in the source."
              />
            </div>
            <div class="flex flex-col sm:max-w-lg w-full gap-2">
              <FieldText
                label="Custom status code"
                :name="`errorResponses[${index}].customStatusCode`"
                :value="errorResponse.value.customStatusCode"
                description="Customize the HTTP status that will be received by the user."
              />
            </div>
            
          </div>
        </div>
        <div class="flex flex-col gap-8 items-start" >
          <Divider />
          <PrimeButton 
            @click="addErrorResponse"
            label="New Error Response"
            outlined
            icon="pi pi-plus-circle"
          />
        </div>
    </template>
  </FormHorizontal>
  <FormHorizontal
    title="Set Origin"
    description="Select the origin from which Azion should fetch the error pages."
  >
    <template #inputs>
      <div class="flex flex-col w-full sm:max-w-xs gap-2">
        <label
          for="method"
          class="text-color text-sm font-medium leading-5"
          >Origin *</label
        >
        <Dropdown
          inputId="originId"
          v-model="originId"
          :options="originOptions"
          optionLabel="name"
          option-value="originId"
        />
      </div>
    </template>
  </FormHorizontal>
</template>
