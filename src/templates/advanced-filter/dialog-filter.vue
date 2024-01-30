'
<script setup>
  import ButtonPrime from 'primevue/button'
  import Dropdown from 'primevue/dropdown'
  import Divider from 'primevue/divider'
  import InlineMessage from 'primevue/inlinemessage'
  import OverlayPanel from 'primevue/overlaypanel'
  import { computed, ref } from 'vue'
  import { OPERATOR_MAPPING, FIELDS_MAPPING } from './component'
  import { useField, useForm } from 'vee-validate'
  import * as yup from 'yup'

  defineOptions({ name: 'dialog-filter' })
  const emit = defineEmits(['applyFilter'])
  const props = defineProps({
    listField: {
      type: Array,
      required: true
    },
    counter: {
      type: Number
    }
  })

  const { meta, handleSubmit, resetForm } = useForm()

  const { value: filterSelected } = useField('filterSelected', yup.object().required())
  const { value: operatorSelected, setValue: setOperatorSelected } = useField(
    'operatorSelected',
    yup.object().required()
  )

  const visible = ref(false)
  const valueFilter = ref()
  const inputOperatorDisabled = ref()
  const inputFilterDisabled = ref()
  const editFilter = ref()

  const filterOverPanel = ref(null)
  const buttonOverPanel = ref(null)
  const filtersOptions = computed(() => {
    return props.listField.map(({ label, value, description, operator, disabled }) => {
      return {
        label,
        value: {
          disabled,
          description,
          value,
          label,
          operator: operator.map(
            ({ props, placeholder, type, value: valueOp, disabled: disabledOp }) => {
              const { value: valueLabel, label: labelOp, format } = OPERATOR_MAPPING[valueOp]
              return {
                label: labelOp,
                value: {
                  disabled: disabledOp,
                  placeholder,
                  value: valueLabel,
                  props,
                  format,
                  type
                }
              }
            }
          )
        }
      }
    })
  })

  const disabledSubmit = computed(() => {
    return !meta.value.valid
  })

  const counterFilter = computed(() => {
    return props.counter
      ? {
          badge: props.counter.toString(),
          badgeClass: 'p-badge-lg text-color bg-transparent'
        }
      : null
  })

  const componentRender = computed(() => {
    return FIELDS_MAPPING[operatorSelected.value.type]
  })

  const changeFilter = () => {
    valueFilter.value = null
    inputOperatorDisabled.value = false
    operatorSelected.value = null

    const oneResult = filterSelected.value.operator.length === 1
    if (oneResult) {
      changeOperator(filterSelected.value.operator[0])
      inputOperatorDisabled.value = true
      return
    }
  }

  const changeOperator = ({ value }) => {
    setOperatorSelected(value)
    valueFilter.value = null
  }

  const toggle = (event) => {
    filterOverPanel.value.toggle(event)
    inputFilterDisabled.value = false
    inputOperatorDisabled.value = false
    editFilter.value = false
    resetForm()
  }

  const show = (item) => {
    buttonOverPanel.value.$el.click()
    inputFilterDisabled.value = true
    editFilter.value = true
    const field = filtersOptions.value.find(({ value }) => value.value === item.valueField)
    filterSelected.value = field.value
    changeFilter()
    const operator = filterSelected.value.operator.find(
      ({ value }) => value.value === item.operator
    )
    const operatorDisabled = { value: operator.value, disabled: false }
    inputOperatorDisabled.value = true
    changeOperator(operatorDisabled)
    operatorSelected.value = operatorDisabled.value
    valueFilter.value = item.value
  }

  const hide = (event) => {
    if (!visible.value) {
      event.stopPropagation()
    }
  }

  const visibleChange = (value) => {
    visible.value = value
  }

  const onSubmit = handleSubmit(async ({ filterSelected, operatorSelected, selectedValue }) => {
    emit('applyFilter', {
      field: filterSelected.label,
      valueField: filterSelected.value,
      operator: operatorSelected.value,
      value: selectedValue,
      format: operatorSelected.format,
      edit: editFilter.value
    })
    toggle()
  })

  defineExpose({ show, hide })
</script>
<template>
  <ButtonPrime
    ref="buttonOverPanel"
    icon="pi pi-plus"
    label="Filter"
    type="button"
    class="overflow-visible"
    severity="secondary"
    badgeClass="!text-xl"
    outlined
    v-bind="counterFilter"
    @click="toggle"
  />
  <OverlayPanel
    ref="filterOverPanel"
    @show="visibleChange(true)"
    @hide="visibleChange(false)"
    aria-haspopup="true"
    aria-controls="overlay_panel"
    :pt="{
      root: { class: 'p-0 w-[576px]' },
      content: { class: 'p-0' }
    }"
  >
    <div class="border-b px-8 py-3.5 surface-border flex">
      <h5 class="text-color text-[17.5px] align-self-center w-full text-xl font-medium leading-7">
        Filter
      </h5>
      <ButtonPrime
        type="button"
        @click="toggle"
        icon="pi pi-times"
        severity="primary"
        outlined
      />
    </div>
    <form @submit.prevent>
      <div class="px-8 py-5 flex gap-3.5 flex-col">
        <span class="text-color-secondary">
          Each combination of operator can only be used once.
        </span>
        <div
          class="flex"
          :class="filterSelected?.description ? 'gap-6' : 'pr-6'"
        >
          <div class="flex flex-col w-1/2 gap-2">
            <label
              for="filter-field"
              class="text-sm font-medium leading-5 text-color"
            >
              Filter
            </label>
            <Dropdown
              id="filter-field"
              @change="changeFilter"
              v-model="filterSelected"
              :options="filtersOptions"
              :disabled="inputFilterDisabled"
              :optionDisabled="({ value }) => value.disabled && !editFilter"
              optionLabel="label"
              optionValue="value"
              class="w-full"
              placeholder="Select a field"
            >
              <template
                #dropdownicon
                v-if="inputFilterDisabled"
              >
                <span class="pi pi-lock text-color-secondary" />
              </template>
            </Dropdown>
          </div>

          <div
            class="flex flex-col w-1/2 gap-2"
            v-if="filterSelected"
          >
            <label
              for="filter-operator"
              class="text-sm font-medium leading-5 text-color"
            >
              Operator
            </label>
            <Dropdown
              id="filter-operator"
              @change="changeOperator"
              v-model="operatorSelected"
              :options="filterSelected.operator"
              :disabled="inputOperatorDisabled"
              :optionDisabled="({ value }) => value.disabled && !editFilter"
              optionLabel="label"
              optionValue="value"
              class="w-full"
              placeholder="Select a operator"
            >
              <template
                #dropdownicon
                v-if="inputOperatorDisabled"
              >
                <span class="pi pi-lock text-color-secondary" />
              </template>
            </Dropdown>
          </div>
        </div>
      </div>
      <Divider v-if="filterSelected?.description" />
      <div
        class="px-8 py-5 flex flex-col"
        v-if="filterSelected?.description"
      >
        <div
          class="flex flex-col"
          :class="{ 'gap-3.5': operatorSelected?.value }"
        >
          <InlineMessage
            class="p-2"
            severity="info"
          >
            {{ filterSelected?.description }}
          </InlineMessage>
          <div class="flex w-full">
            <component
              v-if="operatorSelected?.value"
              :is="componentRender"
              v-model:value="valueFilter"
              v-bind="operatorSelected?.props"
            />
          </div>
        </div>
      </div>
    </form>
    <div
      class="px-8 py-3 border-t surface-border flex gap-2 items-center justify-end p-dialog-footer"
    >
      <ButtonPrime
        type="button"
        label="Cancel"
        @click="toggle"
        severity="primary"
        outlined
      />
      <ButtonPrime
        type="button"
        label="Apply"
        severity="secondary"
        @click="onSubmit"
        :disabled="disabledSubmit"
      />
    </div>
  </OverlayPanel>
</template>
