<template>
  <div class="border border-default border-solid rounded-md bg-surface">
    <div class="flex items-center justify-between px-6 py-3 border-b border-default">
      <span class="text-lg font-semibold text-default">Address Information</span>
    </div>

    <div class="flex flex-col gap-8 p-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        <div class="flex flex-col gap-2 w-full">
          <FieldDropdown
            name="country"
            label="Country"
            required
            :value="country"
            :options="countryOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Select a Country"
            appendTo="self"
            filter
            class="w-full"
            @change="country = $event.value"
          />
        </div>

        <div class="flex flex-col gap-2 w-full">
          <FieldInput
            name="postalCode"
            label="Postal Code"
            required
            :value="postalCode"
            placeholder="00.000.000-00"
            class="w-full"
            @input="postalCode = $event"
          />
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        <div class="flex flex-col gap-2 w-full">
          <FieldDropdown
            name="region"
            label="State/Region"
            required
            :value="region"
            :options="regionOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Select an State/Region"
            appendTo="self"
            filter
            class="w-full"
            @change="region = $event.value"
          />
        </div>

        <div class="flex flex-col gap-2 w-full">
          <FieldInput
            name="city"
            label="City"
            required
            :value="city"
            placeholder="Select a City"
            class="w-full"
            @input="city = $event"
          />
        </div>
      </div>

      <div class="flex flex-col gap-2 w-full">
        <FieldInput
          name="address"
          label="Address"
          required
          :value="address"
          placeholder="123 Example Ave."
          class="w-full"
          @input="address = $event"
        />
      </div>

      <div class="flex flex-col gap-2 w-full">
        <FieldInput
          name="complement"
          label="Apartment, floor, etc."
          :value="complement"
          placeholder="1st floor"
          class="w-full"
          @input="complement = $event"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
  import { computed, ref } from 'vue'
  import FieldInput from '@aziontech/webkit/field-text'
  import FieldDropdown from '@aziontech/webkit/field-dropdown'

  defineOptions({
    name: 'address-information-block'
  })

  const country = ref('')
  const postalCode = ref('')
  const region = ref('')
  const city = ref('')
  const address = ref('')
  const complement = ref('')

  const countryOptions = ref([])
  const regionOptions = ref([])
  const addressInformation = computed(() => ({
    country: country.value,
    postalCode: postalCode.value,
    region: region.value,
    city: city.value,
    address: address.value,
    complement: complement.value
  }))

  defineExpose({
    addressInformation
  })
</script>

<style scoped>
  :deep(.text-base) {
    font-size: 12px !important;
  }
</style>
