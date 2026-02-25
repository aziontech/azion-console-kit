<script setup>
  import { computed, onMounted, ref, watch } from 'vue'
  import { useField } from 'vee-validate'
  import FieldPhoneNumber from '@/templates/form-fields-inputs/fieldPhoneNumber'

  const props = defineProps({
    listCountriesPhoneService: {
      type: Function,
      required: true
    }
  })

  const emit = defineEmits(['countries-loaded'])

  const options = ref([])

  const loading = computed(() => !options.value.length)

  const { value: countryCallCode } = useField('countryCallCode')

  const normalizeCountryCode = (countries) => {
    const currentValue = countryCallCode.value
    if (!currentValue) return

    const hasExactMatch = countries.some((country) => country.value === currentValue)
    if (hasExactMatch) return

    const partialMatch = countries.find((country) => country.value.endsWith(` - ${currentValue}`))
    if (partialMatch) {
      countryCallCode.value = partialMatch.value
    }
  }

  watch(countryCallCode, (newValue) => {
    if (!options.value.length || !newValue) return

    const hasMatch = options.value.some((country) => country.value === newValue)
    if (!hasMatch) {
      const partialMatch = options.value.find((country) => country.value.endsWith(` - ${newValue}`))
      if (partialMatch) {
        countryCallCode.value = partialMatch.value
      }
    }
  })

  onMounted(async () => {
    const countries = await props.listCountriesPhoneService()
    options.value = countries
    normalizeCountryCode(countries)
    emit('countries-loaded', countries)
  })
</script>

<template>
  <FieldPhoneNumber
    v-bind="$attrs"
    :options="options"
    :loading="loading"
  />
</template>
