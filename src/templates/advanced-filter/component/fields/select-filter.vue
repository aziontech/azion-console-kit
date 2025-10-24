<script setup>
  import { computed, ref, onMounted } from 'vue'
  import Select from 'primevue/dropdown'
  import * as yup from 'yup'
  import { useField } from 'vee-validate'
  import { useToast } from 'primevue/usetoast'

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
    },
    selectionLimit: {
      type: Number
    }
  })

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

  const loadValue = computed({
    get: () => {
      return loading.value ? {} : selectedValue.value
    },
    set: (value) => {
      selectedValue.value = value
    }
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
  <div class="flex flex-col w-full sm:w-full gap-2">
    <label
      for="in_field"
      class="text-sm font-medium leading-5 text-color"
    >
      Select Field *
    </label>
    <Select
      id="in_field"
      display="chip"
      resetFilterOnHide
      autoFilterFocus
      filter
      :disabled="props.disabled"
      :loading="loading"
      v-model="loadValue"
      :options="valueOptions"
      :selectionLimit="props.selectionLimit"
      :optionLabel="payload.label"
      :optionValue="payload.value"
      class="w-full"
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
