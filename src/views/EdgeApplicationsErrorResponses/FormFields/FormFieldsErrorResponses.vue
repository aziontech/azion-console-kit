<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal.vue'
  import Divider from 'primevue/divider'
  import Dropdown from 'primevue/dropdown'
  import InputNumber from 'primevue/inputnumber'
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
    <template #inputs>
      {{ errorResponses }}
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
              showButtons
            />
          </div>
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
