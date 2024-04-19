<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal.vue'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import PrimeButton from 'primevue/button'
  import Divider from 'primevue/divider'
  import Dropdown from 'primevue/dropdown'
  import InputNumber from 'primevue/inputnumber'
  import InputText from 'primevue/inputtext'
  import { useField, useFieldArray } from 'vee-validate'
  import { computed, onMounted, ref } from 'vue'

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

  const STATUS_CODE_OPTIONS = [
    {
      code: '400',
      name: '400: Bad Request'
    },
    {
      code: '401',
      name: '401: Unauthorized'
    },
    {
      code: '403',
      name: '403: Forbidden'
    },
    {
      code: '404',
      name: '404: Not Found'
    },
    {
      code: '405',
      name: '405: Method Not Allowed'
    },
    {
      code: '406',
      name: '406: Not Acceptable'
    },
    {
      code: '408',
      name: '408: Request Timeout'
    },
    {
      code: '409',
      name: '409: Conflict'
    },
    {
      code: '410',
      name: '410: Gone'
    },
    {
      code: '411',
      name: '411: Length Required'
    },
    {
      code: '414',
      name: '414: URI Too Long'
    },
    {
      code: '415',
      name: '415: Unsupported Media Type'
    },
    {
      code: '416',
      name: '416: Range Not Satisfiable'
    },
    {
      code: '425',
      name: '425: Too Early'
    },
    {
      code: '426',
      name: '426: Upgrade Required'
    },
    {
      code: '429',
      name: '429: Too Many Requests'
    },
    {
      code: '431',
      name: '431: Request Header Fields Too Large'
    },
    {
      code: '500',
      name: '500: Internal Server Error'
    },
    {
      code: '501',
      name: '501: Not Implemented'
    },
    {
      code: '502',
      name: '502: Bad Gateway'
    },
    {
      code: '503',
      name: '503: Service Unavailable'
    },
    {
      code: '504',
      name: '504: Gateway Timeout'
    },
    {
      code: '505',
      name: '505: HTTP Version Not Supported'
    }
  ]
  const showErrorResponsesInputs = computed(() => errorResponses.value.length > 0)
  const disableOriginKey = computed(() => errorResponses.value.length < 2)
  const statusAnyErrorResponse = computed(
    () => errorResponses.value.filter((element) => element.value.code === 'any')[0]
  )
  const { value: originId } = useField('originId')
  const {
    push: pushErrorResponse,
    remove: removeErrorResponse,
    fields: errorResponses
  } = useFieldArray('errorResponses')

  const defaultErrorResponse = {
    code: '',
    timeout: 0,
    uri: '',
    customStatusCode: ''
  }

  const addErrorResponse = () => {
    pushErrorResponse(defaultErrorResponse)
  }

  const originOptions = ref([])

  const getOrigins = async () => {
    originOptions.value = await props.listOriginsService({ id: props.edgeApplicationId })
  }

  onMounted(async () => {
    await getOrigins()
  })
</script>

<template>
  <FormHorizontal
    title="Error Responses"
    description="Customize error pages and cache TTL based on the HTTP status code received from the origin."
  >
    <template
      #inputs
      v-if="showErrorResponsesInputs"
    >
      <Divider
        align="left"
        type="dashed"
      >
        Default Error Response
      </Divider>
      <div class="flex flex-wrap gap-6">
        <div class="flex flex-col w-full sm:max-w-xs gap-2">
          <label class="text-color text-sm font-medium leading-5">Status Code *</label>
          <span class="p-input-icon-right w-full flex max-w-lg flex-col items-start gap-2">
            <i class="pi pi-lock text-color-secondary" />
            <InputText
              class="w-full"
              value="All"
              type="text"
              :disabled="true"
            />
          </span>
        </div>
        <div class="flex flex-col w-full sm:max-w-xs gap-2">
          <label
            for="default-maximun-ttl-seconds"
            class="text-color text-sm font-medium leading-5"
          >
            Default Response TTL *
          </label>
          <InputNumber
            :min="0"
            :max="31536000"
            v-model="statusAnyErrorResponse.value.timeout"
            showButtons
          />
          <small class="text-xs text-color-secondary font-normal leading-5">
            Set a TTL for all status codes in cache.
          </small>
        </div>
      </div>

      <div
        v-for="(errorResponse, index) in errorResponses"
        :key="index"
        :class="{ hidden: errorResponse.value.code === 'any' }"
      >
        <div class="flex flex-col gap-6">
          <div class="flex">
            <Divider
              align="left"
              type="dashed"
            >
              Custom Error Response
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
                appendTo="self"
                v-model="errorResponse.value.code"
                :options="STATUS_CODE_OPTIONS"
                optionLabel="name"
                option-value="code"
              />
              <small class="text-xs text-color-secondary font-normal leading-5">
                Select the HTTP status code to be customized.
              </small>
            </div>
            <div class="flex flex-col w-full sm:max-w-xs gap-2">
              <label
                for="maximun-ttl-seconds"
                class="text-color text-sm font-medium leading-5"
              >
                Custom Response TTL *
              </label>
              <InputNumber
                :min="0"
                :max="31536000"
                v-model="errorResponse.value.timeout"
                showButtons
              />
              <small class="text-xs text-color-secondary font-normal leading-5">
                Set a TTL for the custom response.
              </small>
            </div>
          </div>
          <div class="flex flex-col sm:max-w-lg w-full gap-2">
            <FieldText
              label="Page Path"
              placeholder="/path/error_page.html"
              :name="`errorResponses[${index}].uri`"
              :value="errorResponse.value.uri"
              description="Select an origin to customize the error page path."
            />
          </div>
          <div class="flex flex-col w-full sm:max-w-xs gap-2">
            <label
              for="maximun-ttl-seconds"
              class="text-color text-sm font-medium leading-5"
            >
              Response Status Code
            </label>
            <InputNumber
              :min="100"
              :max="599"
              v-model="errorResponse.value.customStatusCode"
              showButtons
            />
            <small class="text-xs text-color-secondary font-normal leading-5">
              Change the status code sent in the response.
            </small>
          </div>
        </div>
      </div>
      <div class="flex flex-col gap-8 sm:items-start">
        <Divider />
        <PrimeButton
          @click="addErrorResponse"
          label="Add Error Response"
          outlined
          icon="pi pi-plus-circle"
        />
      </div>
    </template>
  </FormHorizontal>
  <FormHorizontal
    title="Set Origin"
    description="Select the origin from which Azion should fetch error pages."
  >
    <template #inputs>
      <div class="flex flex-col w-full sm:max-w-xs gap-2">
        <label
          for="method"
          class="text-color text-sm font-medium leading-5"
          >Origin *</label
        >
        <Dropdown
          appendTo="self"
          inputId="originId"
          v-model="originId"
          :disabled="disableOriginKey"
          :options="originOptions"
          optionLabel="name"
          option-value="originId"
        />
      </div>
    </template>
  </FormHorizontal>
</template>
