<template>
  <LabelBlock
    :for="props.name"
    :label="props.label"
    :isRequired="$attrs.required"
    :data-testid="customTestId.label"
  />
  <Dropdown
    appendTo="self"
    :id="name"
    :name="props.name"
    :loading="loading"
    v-model="inputValue"
    :options="data"
    :optionLabel="props.optionLabel"
    :optionDisabled="props.optionDisabled"
    :optionValue="props.optionValue"
    :placeholder="props.placeholder"
    @change="emitChange"
    @blur="emitBlur"
    :class="errorMessage ? 'p-invalid' : ''"
    v-bind="$attrs"
    class="w-full"
    :pt="{
      filterInput: {
        class: 'w-full',
        'data-testid': customTestId.filterInput
      },
      trigger: {
        'data-testid': customTestId.trigger
      },
      loadingIcon: {
        'data-testid': customTestId.loadingIcon
      }
    }"
    :data-testid="customTestId.dropdown"
    :virtualScrollerOptions="VIRTUAL_SCROLLER_CONFIG"
  >
    <template
      v-if="enableCustomLabel"
      #value="slotProps"
    >
      <span :data-testid="customTestId.value">
        {{ getLabelBySelectedValue(slotProps.value) }}
      </span>
    </template>

    <template #header>
      <div class="p-2 flex">
        <div class="p-inputgroup">
          <InputText
            type="text"
            v-model="search"
            placeholder="Search"
            class="w-full rounded-r-none"
            ref="focusSearch"
            :data-testid="customTestId.search"
          />
          <span
            class="p-inputgroup-addon"
            @click="searchFilter"
          >
            <i class="pi pi-search"></i>
          </span>
        </div>
      </div>
    </template>

    <template #footer>
      <slot name="footer" />
    </template>
  </Dropdown>

  <small
    v-if="errorMessage"
    :data-testid="customTestId.error"
    class="p-error text-xs font-normal leading-tight"
  >
    {{ errorMessage }}
  </small>
  <small
    class="text-xs text-color-secondary font-normal leading-5"
    :data-testid="customTestId.description"
    v-if="props.description || hasDescriptionSlot"
  >
    <slot name="description">
      {{ props.description }}
    </slot>
  </small>
</template>

<script setup>
  import Dropdown from 'primevue/dropdown'
  import InputText from 'primevue/inputtext'
  import { useField } from 'vee-validate'
  import { computed, toRef, useSlots, useAttrs, ref, onMounted, watchEffect, watch } from 'vue'
  import { watchDebounced } from '@vueuse/core'
  import LabelBlock from '@/templates/label-block'

  const props = defineProps({
    value: {
      type: [String, Number],
      default: ''
    },
    name: {
      type: String,
      required: true
    },
    label: {
      type: String,
      default: ''
    },
    placeholder: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      default: ''
    },
    optionLabel: {
      type: String,
      default: ''
    },
    optionValue: {
      type: String,
      default: ''
    },
    moreOptions: {
      type: Array,
      default: null
    },
    optionDisabled: {
      type: [String, Function],
      default: ''
    },
    service: {
      type: Function,
      required: true
    },
    loadService: {
      type: Function,
      required: true
    },
    enableWorkaroundLabelToDisabledOptions: {
      type: Boolean,
      default: false
    }
  })

  const emit = defineEmits(['onBlur', 'onChange', 'onSelectOption'])

  const PAGE_INCREMENT = 1
  const PAGE_SIZE = 100
  const INITIAL_PAGE = 1
  const SEARCH_DEBOUNCE = 500
  const SEARCH_MAX_WAIT = 1000
  const NUMBER_OF_CHARACTERS_MIN_FOR_SEARCH = 3
  const NUMBER_OF_CHARACTERS_TO_RESET_SEARCH = 0

  const name = toRef(props, 'name')
  const slots = useSlots()
  const data = ref([])
  const loading = ref(false)
  const totalCount = ref(0)
  const page = ref(INITIAL_PAGE)
  const search = ref('')
  const focusSearch = ref(null)

  onMounted(async () => {
    await fetchData()
  })

  const hasDescriptionSlot = !!slots.description
  const { value: inputValue, errorMessage } = useField(name, undefined, {
    initialValue: props.value
  })

  const handleLazyLoad = async (event) => {
    const { last } = event
    const numberOfPage = Math.ceil(totalCount.value / PAGE_SIZE)
    const goRequest = last >= data.value?.length

    if (page.value < numberOfPage && goRequest && !loading.value) {
      page.value += PAGE_INCREMENT
      await fetchData(page.value)
    }
  }

  const emitBlur = () => {
    emit('onBlur')
  }

  const emitChange = () => {
    const selectedOption = data.value.find(
      (option) => option[props.optionValue] === inputValue.value
    )

    emit('onChange', inputValue.value)

    if (selectedOption) {
      emit('onSelectOption', selectedOption)
    }
  }

  /**
   * Workaround to resolve the issue described in https://github.com/primefaces/primevue/issues/4431
   * This should be remove from this field component as soon as the
   * primevue team fixes the issue.
   * When we select a disabled value, the label  is not showing
   * @param {*} selectedValue The selected value in the Dropdown component.
   * @returns {string | null} The selected value if it corresponds to a disabled option, or null otherwise.
   */
  const getLabelBySelectedValue = (selectedValue) => {
    const result = props.options.find((option) => option.value === selectedValue)
    return result?.label
  }

  const fetchData = async (currentPage = 1) => {
    try {
      loading.value = true

      if (currentPage === INITIAL_PAGE) {
        data.value = []
      }

      const response = await props.service({
        pageSize: PAGE_SIZE,
        page: currentPage,
        search: search.value,
        ordering: 'name'
      })

      totalCount.value = response.count
      let results = response.body?.map((item) => {
        return {
          [props.optionLabel]: item.name,
          [props.optionValue]: item.id,
          ...props?.moreOptions?.reduce(
            (additionalFields, option) => ({
              ...additionalFields,
              [option]: item[option]
            }),
            {}
          )
        }
      })

      if (currentPage === INITIAL_PAGE) {
        data.value = results
      } else {
        const uniqueResults = results.filter(
          (newItem) =>
            !data.value.some(
              (existingItem) => existingItem[props.optionValue] === newItem[props.optionValue]
            )
        )

        data.value = [...data.value, ...uniqueResults]
      }
    } finally {
      loading.value = false
    }
  }

  const loadSelectedValue = async (id) => {
    if (!id) return
    try {
      loading.value = true
      const results = await props.loadService({ id })
      if (!results) return

      const newOption = {
        [props.optionLabel]: results.name,
        [props.optionValue]: results.id,
        ...props?.moreOptions?.reduce(
          (additionalFields, option) => ({
            ...additionalFields,
            [option]: results[option]
          }),
          {}
        )
      }
      data.value = [newOption, ...data.value]
      emitChange()
    } finally {
      loading.value = false
    }
  }

  const searchFilter = () => {
    page.value = INITIAL_PAGE
    fetchData()
  }

  const enableCustomLabel = computed(() => {
    return props.enableWorkaroundLabelToDisabledOptions && !!inputValue.value
  })
  /**
   * end of primevue workaround
   */

  const attrs = useAttrs()

  const customTestId = computed(() => {
    const id = attrs['data-testid'] || 'field-dropdown'

    return {
      label: `${id}__label`,
      dropdown: `${id}__dropdown`,
      value: `${id}__value`,
      description: `${id}__description`,
      error: `${id}__error-message`,
      filterInput: `${id}__dropdown-filter-input`,
      trigger: `${id}__dropdown-trigger`,
      loadingIcon: `${id}__loading-icon`,
      search: `${id}__dropdown-search`
    }
  })

  watch(
    () => props.value,
    (newValue) => {
      const existitemInList = data.value?.some((item) => item[props.optionValue] === newValue)
      if (!existitemInList) {
        loadSelectedValue(newValue)
      }
    }
  )

  watchDebounced(
    search,
    () => {
      if (
        search.value.length >= NUMBER_OF_CHARACTERS_MIN_FOR_SEARCH ||
        search.value.length === NUMBER_OF_CHARACTERS_TO_RESET_SEARCH
      ) {
        searchFilter()
      }
    },
    { debounce: SEARCH_DEBOUNCE, maxWait: SEARCH_MAX_WAIT }
  )

  watchEffect(() => {
    if (focusSearch.value) {
      focusSearch.value.$el.focus()
    }
  })

  const VIRTUAL_SCROLLER_CONFIG = {
    lazy: true,
    onLazyLoad: handleLazyLoad,
    itemSize: 38,
    showLoader: true,
    loading
  }
</script>
