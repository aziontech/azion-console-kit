<template>
  <LabelBlock
    v-if="props.label"
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
    :optionGroupLabel="props.optionGroupLabel"
    :optionGroupChildren="props.optionGroupChildren"
    :placeholder="props.placeholder"
    :showClear="props.enableClearOption"
    @change="emitChange"
    @blur="emitBlur"
    :class="errorMessage ? 'p-invalid' : ''"
    v-bind="$attrs"
    class="w-full"
    :pt="{
      clearIcon: {
        'data-testid': customTestId.clearIcon
      },
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
      <span
        class="flex align-items-center gap-2"
        :data-testid="customTestId.value"
      >
        <i
          v-if="showIcon"
          :class="`pi ${iconSelected} ${iconColor}`"
        ></i>
        {{ getLabelBySelectedValue(slotProps.value) }}
      </span>
    </template>
    <template #option="slotProps">
      <div class="flex align-items-center gap-2">
        <i
          v-if="slotProps.option.icon"
          :class="`pi ${slotProps.option.icon} ${iconColor}`"
        ></i>
        <span
          v-else-if="!slotProps.option.icon && showIcon"
          class="w-4"
        ></span>
        <div>{{ slotProps.option.name }}</div>
      </div>
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
    },
    enableClearOption: {
      type: Boolean,
      default: false
    },
    disableEmitFirstRender: {
      type: Boolean,
      default: false
    },
    optionGroupLabel: {
      type: String,
      default: ''
    },
    optionGroupChildren: {
      type: String,
      default: ''
    },
    defaultPosition: {
      type: Number,
      default: 0
    },
    showIcon: {
      type: Boolean,
      default: false
    },
    iconColor: {
      type: String,
      default: ''
    }
  })

  const emit = defineEmits(['onBlur', 'onChange', 'onSelectOption', 'onAccessDenied'])

  const PAGE_INCREMENT = 1
  const PAGE_SIZE = 100
  const INITIAL_PAGE = 1
  const SEARCH_DEBOUNCE = 500
  const SEARCH_MAX_WAIT = 1000
  const NUMBER_OF_CHARACTERS_MIN_FOR_SEARCH = 3
  const NUMBER_OF_CHARACTERS_TO_RESET_SEARCH = 0
  const PERMISSION_DENIED = 'You do not have permission'
  const hasNoPermission = ref(false)
  const iconSelected = ref('')
  const name = toRef(props, 'name')
  const slots = useSlots()
  const data = ref([])
  const loading = ref(false)
  const totalCount = ref(0)
  const page = ref(INITIAL_PAGE)
  const search = ref('')
  const focusSearch = ref(null)
  const disableEmitInit = ref(props.disableEmitFirstRender)
  const alreadyLoadedData = ref(false)

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
    let selectedOption = null

    // Check if data is grouped
    const isGroupedData =
      data.value.length > 0 &&
      data.value.some((item) => item[props.optionGroupLabel] && item[props.optionGroupChildren])

    if (isGroupedData) {
      // Search for the selected option within groups
      for (const group of data.value) {
        const groupItems = group[props.optionGroupChildren] || []
        selectedOption = groupItems.find((option) => option[props.optionValue] === inputValue.value)
        if (selectedOption) break
      }
    } else {
      // Search in flat data (existing behavior)
      selectedOption = data.value.find((option) => option[props.optionValue] === inputValue.value)
    }

    emit('onChange', inputValue.value)

    if (inputValue.value === null) {
      emit('onClear')
    }

    if (selectedOption) {
      emit('onSelectOption', selectedOption)
    }
  }

  const preventValueSetWithoutPermission = () => {
    data.value = [
      {
        [props.optionValue]: props.value,
        name: props.value
      }
    ]
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
    // Don't proceed if there's no selected value
    if (!selectedValue) return null

    // Find the selected option
    let selectedOption = null

    if (props.options) {
      selectedOption = props.options.find((option) => option.value === selectedValue)
      return selectedOption?.label
    }

    if (data.value?.length) {
      const isGroupedData = data.value.some(
        (item) => item[props.optionGroupLabel] && item[props.optionGroupChildren]
      )

      if (isGroupedData) {
        for (const group of data.value) {
          const groupItems = group[props.optionGroupChildren] || []
          selectedOption = groupItems.find((option) => option[props.optionValue] === selectedValue)
          if (selectedOption) break
        }
      } else {
        selectedOption = data.value.find((option) => option[props.optionValue] === selectedValue)
      }
    }

    // Set the icon in a separate effect to prevent recursive updates
    if (selectedOption) {
      // Use nextTick to avoid the reactive update during render
      Promise.resolve().then(() => {
        iconSelected.value = selectedOption.icon
      })
      return selectedOption[props.optionLabel] || selectedOption.name
    }

    return null
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

      // Check if response is grouped data (has label and items structure)
      const isGroupedData =
        Array.isArray(response.body) &&
        response.body.some((item) => item.label && Array.isArray(item.items))

      let results

      if (isGroupedData) {
        // Process grouped data
        results = response.body.map((group) => ({
          [props.optionGroupLabel]: group.label,
          [props.optionGroupChildren]:
            group.items?.map((item) => ({
              [props.optionLabel]: item.name,
              [props.optionValue]: item.id,
              ...props?.moreOptions?.reduce(
                (additionalFields, option) => ({
                  ...additionalFields,
                  [option]: item[option]
                }),
                {}
              )
            })) || []
        }))
      } else {
        // Process flat data (existing behavior)
        results = response.body?.map((item) => {
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
      }

      if (currentPage === INITIAL_PAGE) {
        data.value = results ? results : []
      } else {
        if (isGroupedData) {
          // For grouped data, merge groups and their items
          const mergedGroups = []

          results.forEach((newGroup) => {
            const existingGroupIndex = data.value.findIndex(
              (existingGroup) =>
                existingGroup[props.optionGroupLabel] === newGroup[props.optionGroupLabel]
            )

            if (existingGroupIndex >= 0) {
              // Merge items into existing group
              const existingItems = data.value[existingGroupIndex][props.optionGroupChildren] || []
              const newItems = newGroup[props.optionGroupChildren] || []

              const uniqueNewItems = newItems.filter(
                (newItem) =>
                  !existingItems.some(
                    (existingItem) => existingItem[props.optionValue] === newItem[props.optionValue]
                  )
              )

              data.value[existingGroupIndex][props.optionGroupChildren] = [
                ...existingItems,
                ...uniqueNewItems
              ]
            } else {
              // Add new group
              mergedGroups.push(newGroup)
            }
          })

          data.value = [...data.value, ...mergedGroups]
        } else {
          // For flat data (existing behavior)
          const uniqueResults = results.filter(
            (newItem) =>
              !data.value.some(
                (existingItem) => existingItem[props.optionValue] === newItem[props.optionValue]
              )
          )

          data.value = [...data.value, ...uniqueResults]
        }
      }

      if (
        currentPage === INITIAL_PAGE &&
        props.value &&
        search.value === '' &&
        !alreadyLoadedData.value
      ) {
        await checkValueInList(props.value)
      }
    } catch (error) {
      //Here we check if the error was caused by a lack of permission. If that's not the case, we add the ID to avoid blocking the user's experience.
      if (typeof error === 'string' && error?.includes(PERMISSION_DENIED)) {
        hasNoPermission.value = true
        preventValueSetWithoutPermission()
      }
      emit('onAccessDenied')
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

      // Check if data is grouped
      const isGroupedData =
        data.value.length > 0 &&
        data.value.some((item) => item[props.optionGroupLabel] && item[props.optionGroupChildren])

      let optionExists = false

      if (isGroupedData) {
        // Check if option exists in any group
        optionExists = data.value.some((group) =>
          group[props.optionGroupChildren]?.some(
            (item) => item[props.optionValue] === newOption[props.optionValue]
          )
        )

        if (!optionExists) {
          // Add to first group or create a new group
          if (data.value.length > 0) {
            data.value[props.defaultPosition][props.optionGroupChildren] = [
              newOption,
              ...data.value[props.defaultPosition][props.optionGroupChildren]
            ]
          } else {
            // Create a default group if no groups exist
            data.value = [
              {
                [props.optionGroupLabel]: 'Options',
                [props.optionGroupChildren]: [newOption]
              }
            ]
          }
        }
      } else {
        // Flat data (existing behavior)
        optionExists = data.value.some(
          (item) => item[props.optionValue] === newOption[props.optionValue]
        )

        if (!optionExists) {
          data.value = [newOption, ...data.value]
        }
      }

      if (disableEmitInit.value) {
        disableEmitInit.value = false
        return
      }
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
      clearIcon: `${id}__clear-icon`,
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
      if (hasNoPermission.value) {
        preventValueSetWithoutPermission()
      }
      checkValueInList(newValue)
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

  const checkValueInList = (value) => {
    const existitemInList = data.value?.some((item) => item[props.optionValue] === value)

    if (!existitemInList) {
      loadSelectedValue(value)
      alreadyLoadedData.value = true
    }
  }

  const refreshData = async () => {
    page.value = INITIAL_PAGE
    search.value = ''
    await fetchData()
  }

  // Expose refresh function to parent components
  defineExpose({
    refreshData
  })
</script>
