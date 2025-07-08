<template>
  <FormHorizontal
    title="Payload"
    description="Customize the essential information that'll be sent in the data."
    v-if="endpoint === 'standard'"
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          :disabled="hasNoPermissionToEditDataStream"
          label="Payload Format"
          required
          name="payloadFormat"
          :value="payloadFormat"
          description="The format that payload will be sent. The $dataset variable will be replaced by all logs already with the log line separator applied."
          placeholder="$dataset"
          data-testid="data-stream-form__destination__payload-format-field"
        />
      </div>

      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          :disabled="hasNoPermissionToEditDataStream"
          label="Payload Log Line Separator"
          required
          name="lineSeparator"
          :value="lineSeparator"
          :description="placeholderLineSeparator"
          data-testid="data-stream-form__destination__payload-line-separator-field"
        />
      </div>

      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldNumber
          :disabled="hasNoPermissionToEditDataStream"
          label="Payload Max Size"
          name="maxSize"
          :min="MIN_PAYLOAD_SIZE_IN_BYTES"
          :max="MAX_PAYLOAD_SIZE_IN_BYTES"
          :value="maxSize"
          description="Customizable maximum size of data packets in bytes. Accepts values starting from 1000000."
          placeholder="1000000"
          :useGrouping="false"
          data-testid="data-stream-form__destination__payload-max-size-field"
        />
      </div>
    </template>
  </FormHorizontal>
</template>

<script setup>
  import { ref, computed } from 'vue'
  import { useField } from 'vee-validate'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import FieldNumber from '@/templates/form-fields-inputs/fieldNumber.vue'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'

  // Definindo a prop endpoint
  defineProps({
    endpoint: {
      type: String,
      required: true
    }
  })

  // Importar variáveis e funções necessárias
  const { value: payloadFormat } = useField('payloadFormat')
  const { value: lineSeparator } = useField('lineSeparator')
  const { value: maxSize } = useField('maxSize')

  const MIN_PAYLOAD_SIZE_IN_BYTES = ref(1000000)
  const MAX_PAYLOAD_SIZE_IN_BYTES = ref(2147483647)

  const placeholderLineSeparator = computed(() => {
    const text = '"\\n"'
    return `Character that'll be used at the end of each log line. The ${text} escape sequence breaks values into different lines in NDJSON format.`
  })

  // Supondo que hasNoPermissionToEditDataStream seja uma prop ou uma variável computada
  const hasNoPermissionToEditDataStream = computed(() => !store.hasPermissionToEditDataStream)
</script>
