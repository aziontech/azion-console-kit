'
<script setup>
  import ButtonPrime from 'primevue/button'
  import Divider from 'primevue/divider'
  import Dropdown from 'primevue/dropdown'
  import InlineMessage from 'primevue/inlinemessage'
  import OverlayPanel from 'primevue/overlaypanel'
  import Sidebar from 'primevue/sidebar'
  import { useField, useForm } from 'vee-validate'
  import { computed, ref } from 'vue'
  import * as yup from 'yup'
  import { FIELDS_MAPPING, OPERATOR_MAPPING } from './component'

  defineOptions({ name: 'dialog-filter' })
  const emit = defineEmits(['applyFilter'])
  const props = defineProps({
    filtersOptions: {
      type: Array,
      required: true
    },
    disabled: {
      type: Boolean
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

  const options = computed(() => {
    return props.filtersOptions.map(
      ({ label, value, description, operator, disabled, mostRelevant = 0 }) => {
        return {
          label,
          mostRelevant,
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
      }
    )
  })

  const disabledSubmit = computed(() => {
    return !meta.value.valid
  })

  const counterFilter = computed(() => {
    return props.counter
      ? {
          badge: props.counter.toString(),
          badgeClass: 'p-badge-lg text-color bg-transparent h-5 min-w-[20px]'
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

  const SCREEN_BREAKPOINT_MD = 768
  const showMobileFilter = ref(false)

  const toggle = (event) => {
    if (window.innerWidth <= SCREEN_BREAKPOINT_MD) {
      showMobileFilter.value = !showMobileFilter.value
    } else {
      filterOverPanel.value.toggle(event)
    }

    inputFilterDisabled.value = false
    inputOperatorDisabled.value = false
    editFilter.value = false
    resetForm()
  }

  const show = (item) => {
    buttonOverPanel.value.$el.click()
    inputFilterDisabled.value = true
    editFilter.value = true
    const field = options.value.find(({ value }) => value.value === item.valueField)
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

  const onSubmit = handleSubmit(
    async ({ filterSelected, operatorSelected, selectedValue, begin, end }) => {
      emit('applyFilter', {
        field: filterSelected.label,
        valueField: filterSelected.value,
        operator: operatorSelected.value,
        value: selectedValue ?? { begin, end },
        format: operatorSelected.format,
        edit: editFilter.value,
        type: operatorSelected.type
      })
      toggle()
    }
  )

  defineExpose({ show, hide })
</script>
<template>
  <ButtonPrime
    ref="buttonOverPanel"
    icon="pi pi-plus"
    label="Filter"
    type="button"
    class="flex justify-center items-center md:rounded-[6px_0px_0px_6px] min-w-max md:h-12"
    severity="secondary"
    badgeClass="!text-xl"
    :disabled="disabled"
    outlined
    v-bind="counterFilter"
    @click="toggle"
    data-testid="filter-button"
  />

  <OverlayPanel
    ref="filterOverPanel"
    @show="visibleChange(true)"
    @hide="visibleChange(false)"
    aria-haspopup="true"
    aria-controls="overlay_panel"
    :pt="{
      root: { class: 'p-0 md:w-[576px] max-sm:w-full' },
      content: { class: 'p-0' }
    }"
    data-testid="filter-overlay-panel"
  >
    <div class="border-b px-8 py-3.5 surface-border flex" data-testid="filter-header">
      <h5 class="text-color text-[17.5px] align-self-center w-full text-xl font-medium leading-7" data-testid="filter-title">
        Filter
      </h5>
      <ButtonPrime
        type="button"
        @click="toggle"
        icon="pi pi-times"
        severity="primary"
        outlined
        data-testid="filter-close-button"
      />
    </div>
    <form @submit.prevent data-testid="filter-form">
      <div class="px-8 py-5 flex gap-3.5 flex-col" data-testid="filter-options-container">
        <span class="text-color-secondary" data-testid="filter-description">
          Each combination of operator can only be used once.
        </span>
        <div
          class="flex sm:w-full max-sm:flex-col"
          :class="filterSelected?.description ? 'gap-6' : 'md:pr-6'"
          data-testid="filter-fields-container"
        >
          <div class="flex flex-col md:w-1/2 gap-2 sm:max-w-xs w-full" data-testid="filter-field-container">
            <label
              for="filter-field"
              class="text-sm font-medium leading-5 text-color"
              data-testid="filter-field-label"
            >
              Filter
            </label>
            <Dropdown
              appendTo="self"
              id="filter-field"
              @change="changeFilter"
              v-model="filterSelected"
              :options="options"
              resetFilterOnHide
              filter
              autoFilterFocus
              :disabled="inputFilterDisabled"
              :optionDisabled="({ value }) => value.disabled && !editFilter"
              optionLabel="label"
              optionValue="value"
              class="w-full"
              placeholder="Select a field"
              filterIcon="pi pi-search"
              data-testid="filter-field-dropdown"
            >
              <template
                #dropdownicon
                v-if="inputFilterDisabled"
              >
                <span class="pi pi-lock text-color-secondary" data-testid="filter-field-disabled-icon" />
              </template>
            </Dropdown>
          </div>

          <div
            class="flex flex-col w-1/2 gap-2 max-sm:w-full"
            v-if="filterSelected"
            data-testid="filter-operator-container"
          >
            <label
              for="filter-operator"
              class="text-sm font-medium leading-5 text-color"
              data-testid="filter-operator-label"
            >
              Operator
            </label>
            <Dropdown
              appendTo="self"
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
              data-testid="filter-operator-dropdown"
            >
              <template
                #dropdownicon
                v-if="inputOperatorDisabled"
              >
                <span class="pi pi-lock text-color-secondary" data-testid="filter-operator-disabled-icon" />
              </template>
            </Dropdown>
          </div>
        </div>
      </div>
      <Divider v-if="filterSelected?.label" data-testid="filter-divider" />
      <div
        class="px-8 py-5 flex flex-col"
        v-if="filterSelected?.label"
        data-testid="filter-value-container"
      >
        <div
          class="flex flex-col"
          :class="{ 'gap-3.5': operatorSelected?.value }"
          data-testid="filter-value-options"
        >
          <InlineMessage
            class="p-2"
            severity="info"
            data-testid="filter-value-description"
          >
            {{ filterSelected?.description }}
          </InlineMessage>
          <div class="flex w-full" data-testid="filter-value-input">
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
      data-testid="filter-buttons-container"
    >
      <ButtonPrime
        type="button"
        label="Cancel"
        @click="toggle"
        class="max-md:min-w-max"
        severity="primary"
        outlined
        data-testid="filter-cancel-button"
      />
      <ButtonPrime
        type="button"
        class="max-md:w-full"
        label="Apply"
        severity="secondary"
        @click="onSubmit"
        :disabled="disabledSubmit"
        data-testid="filter-apply-button"
      />
    </div>
  </OverlayPanel>

  <!-- Mobile Overlay Filter Panel -->
  <Sidebar
    :visible="showMobileFilter"
    position="bottom"
    header="Filter"
    :show-close-icon="false"
    :pt="{
      root: { class: '!h-[90%] md:hidden flex' },
      headerContent: { class: 'w-full' },
      mask: { class: 'md:hidden flex' },
      content: { class: '!p-0' }
    }"
    data-testid="filter-sidebar"
  >
    <template #closeicon>
      <div class="flex items-center justify-between" data-testid="filter-sidebar-close-icon">
        <h2 data-testid="filter-sidebar-title">Filter</h2>
        <ButtonPrime
          icon="pi pi-times"
          @click="visibleChange(false)"
          size="small"
          class="flex-none surface-border text-sm w-8 h-8"
          text
          data-testid="filter-sidebar-close-button"
        />
      </div>
    </template>
    <template #container>
      <div class="p-sidebar-header" data-testid="filter-sidebar-header">
        <div class="p-sidebar-header-content w-full" data-testid="filter-sidebar-header-content">
          <div class="flex items-center justify-between">
            <h2 data-testid="filter-sidebar-title">Filter</h2>
            <ButtonPrime
              icon="pi pi-times"
              @click="toggle"
              size="small"
              class="flex-none surface-border text-sm w-8 h-8"
              text
              data-testid="filter-sidebar-close-button"
            />
          </div>
        </div>
      </div>

      <form @submit.prevent data-testid="filter-sidebar-form">
        <div class="p-3 pb-5 flex gap-3.5 flex-col" data-testid="filter-sidebar-options-container">
          <span class="text-color-secondary" data-testid="filter-sidebar-description">
            Each combination of operator can only be used once.
          </span>
          <div
            class="flex sm:w-full max-sm:flex-col"
            :class="filterSelected?.description ? 'gap-6' : 'md:pr-6'"
            data-testid="filter-sidebar-fields-container"
          >
            <div class="flex flex-col md:w-1/2 gap-2 sm:max-w-xs w-full" data-testid="filter-sidebar-field-container">
              <label
                for="filter-field"
                class="text-sm font-medium leading-5 text-color"
                data-testid="filter-sidebar-field-label"
              >
                Filter
              </label>
              <Dropdown
                appendTo="self"
                id="filter-field"
                @change="changeFilter"
                v-model="filterSelected"
                :options="options"
                resetFilterOnHide
                filter
                autoFilterFocus
                :disabled="inputFilterDisabled"
                :optionDisabled="({ value }) => value.disabled && !editFilter"
                optionLabel="label"
                optionValue="value"
                class="w-full"
                placeholder="Select a field"
                filterIcon="pi pi-search"
                data-testid="filter-sidebar-field-dropdown"
              >
                <template
                  #dropdownicon
                  v-if="inputFilterDisabled"
                >
                  <span class="pi pi-lock text-color-secondary" data-testid="filter-sidebar-field-disabled-icon" />
                </template>
              </Dropdown>
            </div>

            <div
              class="flex flex-col w-1/2 gap-2 max-sm:w-full"
              v-if="filterSelected"
              data-testid="filter-sidebar-operator-container"
            >
              <label
                for="filter-operator"
                class="text-sm font-medium leading-5 text-color"
                data-testid="filter-sidebar-operator-label"
              >
                Operator
              </label>
              <Dropdown
                appendTo="self"
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
                data-testid="filter-sidebar-operator-dropdown"
              >
                <template
                  #dropdownicon
                  v-if="inputOperatorDisabled"
                >
                  <span class="pi pi-lock text-color-secondary" data-testid="filter-sidebar-operator-disabled-icon" />
                </template>
              </Dropdown>
            </div>
          </div>
        </div>
        <Divider v-if="filterSelected?.label" data-testid="filter-sidebar-divider" />
        <div
          class="px-3 py-5 flex flex-col"
          v-if="filterSelected?.label"
          data-testid="filter-sidebar-value-container"
        >
          <div
            class="flex flex-col"
            :class="{ 'gap-3.5': operatorSelected?.value }"
            data-testid="filter-sidebar-value-options"
          >
            <InlineMessage
              class="p-2"
              severity="info"
              data-testid="filter-sidebar-value-description"
            >
              {{ filterSelected?.description }}
            </InlineMessage>
            <div class="flex w-full" data-testid="filter-sidebar-value-input">
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

      <div class="mt-auto" data-testid="filter-sidebar-buttons-container">
        <div
          class="p-3 border-t surface-border flex gap-2 items-center justify-end p-dialog-footer"
        >
          <ButtonPrime
            type="button"
            label="Cancel"
            @click="toggle"
            class="max-md:min-w-max"
            severity="primary"
            outlined
            data-testid="filter-sidebar-cancel-button"
          />
          <ButtonPrime
            type="button"
            class="max-md:w-full"
            label="Apply"
            severity="secondary"
            @click="onSubmit"
            :disabled="disabledSubmit"
            data-testid="filter-sidebar-apply-button"
          />
        </div>
      </div>
    </template>
  </Sidebar>
</template>