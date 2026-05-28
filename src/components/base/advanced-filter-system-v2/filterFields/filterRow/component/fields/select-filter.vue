<script setup>
  import { computed, ref, onMounted, watch } from 'vue'
  import Select from '@aziontech/webkit/dropdown'
  import * as yup from 'yup'
  import { useField } from 'vee-validate'
  import { useToast } from '@aziontech/webkit/use-toast'

  defineOptions({ name: 'selectFilter' })

  const props = defineProps({
    value: {
      type: Object
    },
    services: {
      type: Function
    },
    options: {
      type: Object
    },
    placeholder: {
      type: String,
      default: 'Select'
    },
    payload: {
      type: Object,
      default: () => {
        return {
          label: 'label',
          value: 'value'
        }
      }
    },
    disabled: {
      type: Boolean
    }
  })

  const emit = defineEmits(['update:value'])

  const valueOptions = ref([])
  const loading = ref(false)
  const toast = useToast()
  const { value: selectedValue, errorMessage } = useField(
    'selectedValue',
    yup.object().required(),
    {
      initialValue: props.value
    }
  )

  watch(selectedValue, (newValue) => emit('update:value', newValue))

  const loadValue = computed({
    get: () => {
      return loading.value ? {} : selectedValue.value
    },
    set: (value) => {
      selectedValue.value = value
    }
  })

  const shouldFilterOptions = computed(() => {
    return valueOptions.value.length > 8
  })

  const serviceIn = async () => {
    try {
      loading.value = true
      const resultOptions = props.options ? props.options : await props.services()
      valueOptions.value = resultOptions.map((item) => ({
        [props.payload.label]: item[props.payload.label],
        value: item
      }))
    } catch (error) {
      toast.add({
        detail: error,
        closable: true,
        severity: 'error',
        summary: 'Loading failed'
      })
      throw new Error(error)
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    serviceIn()
  })
</script>
<template>
  <div class="flex flex-col w-full min-w-0 sm:w-full gap-2">
    <Select
      id="in_field"
      resetFilterOnHide
      autoFilterFocus
      :filter="shouldFilterOptions"
      scrollHeight="240px"
      :disabled="props.disabled"
      :loading="loading"
      v-model="loadValue"
      :options="valueOptions"
      :optionLabel="payload.label"
      :optionValue="payload.value"
      class="w-full min-w-0"
      :placeholder="props.placeholder"
      :pt="{
        panel: { class: 'w-full max-w-lg' },
        option: { class: 'truncate' }
      }"
    />
    <small
      v-if="errorMessage"
      class="p-error text-xs font-normal leading-tight"
      >{{ errorMessage }}</small
    >
  </div>
</template>
