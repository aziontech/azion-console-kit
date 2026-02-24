<script setup>
  import { computed, toRef, useAttrs } from 'vue'
  import { useField } from 'vee-validate'
  import Dropdown from 'primevue/dropdown'
  import InputMask from 'primevue/inputmask'
  import LabelBlock from '@/templates/label-block'

  const props = defineProps({
    options: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    },
    label: {
      type: String,
      default: 'Phone Number'
    },
    description: {
      type: String,
      default: ''
    },
    countryCodeName: {
      type: String,
      default: 'countryCallCode'
    },
    mobileName: {
      type: String,
      default: 'mobile'
    }
  })

  const emit = defineEmits(['change:countryCode', 'change:mobile'])

  const attrs = useAttrs()
  const countryCodeName = toRef(props, 'countryCodeName')
  const mobileName = toRef(props, 'mobileName')

  const customTestId = computed(() => {
    const id = attrs['data-testid'] || 'field-phone-number'

    return {
      label: `${id}__label`,
      countryDropdown: `${id}__country-dropdown`,
      filterInput: `${id}__filter-input`,
      mobileInput: `${id}__mobile-input`,
      description: `${id}__description`,
      errorMobile: `${id}__error-mobile`,
      errorCountryCode: `${id}__error-country-code`
    }
  })

  const { value: countryCallCode, errorMessage: errorCountryCallCode } = useField(
    countryCodeName,
    undefined,
    { initialValue: '' }
  )
  const { value: mobile, errorMessage: errorMobile } = useField(mobileName, undefined, {
    initialValue: ''
  })

  const handleCountryChange = () => {
    emit('change:countryCode', countryCallCode.value)
  }

  const handleMobileInput = () => {
    emit('change:mobile', mobile.value)
  }
</script>

<template>
  <div class="flex flex-col sm:max-w-lg w-full gap-2">
    <LabelBlock
      :data-testid="customTestId.label"
      :for="mobileName"
      :label="props.label"
      isRequired
    />
    <div class="flex gap-2">
      <div class="p-inputgroup">
        <Dropdown
          :data-testid="customTestId.countryDropdown"
          filter
          autoFilterFocus
          appendTo="self"
          :id="countryCodeName"
          :name="countryCodeName"
          :options="props.options"
          optionLabel="labelFormat"
          optionValue="value"
          :loading="props.loading"
          :disabled="props.loading || props.disabled"
          :class="{ 'p-invalid': errorCountryCallCode }"
          class="surface-border border-r-0 w-1/4"
          v-model="countryCallCode"
          @change="handleCountryChange"
          :pt="{
            filterInput: {
              class: 'w-full',
              'data-testid': customTestId.filterInput
            }
          }"
        >
          <template #option="{ option }">
            {{ option.label }}
          </template>
        </Dropdown>

        <InputMask
          :data-testid="customTestId.mobileInput"
          date="phone"
          v-model="mobile"
          class="w-full"
          :name="mobileName"
          :disabled="props.loading || props.disabled"
          mask="?99999999999999999999"
          placeholder="5500999999999"
          :class="{ 'p-invalid': errorMobile }"
          @update:modelValue="handleMobileInput"
        />
      </div>
    </div>
    <small
      v-if="errorCountryCallCode"
      class="p-error text-xs font-normal leading-tight"
      :data-testid="customTestId.errorCountryCode"
    >
      {{ errorCountryCallCode }}
    </small>
    <small
      v-if="errorMobile"
      class="p-error text-xs font-normal leading-tight"
      :data-testid="customTestId.errorMobile"
    >
      {{ errorMobile }}
    </small>
    <small
      v-if="props.description"
      class="text-xs text-color-secondary font-normal leading-5"
      :data-testid="customTestId.description"
    >
      {{ props.description }}
    </small>
  </div>
</template>
