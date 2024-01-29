<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import FieldSwitch from '@/templates/form-fields-inputs/fieldSwitch'
  import FieldDropdown from '@/templates/form-fields-inputs/fieldDropdown.vue'
  import Divider from 'primevue/divider'
  import PrimeMenu from 'primevue/menu'
  import PrimeButton from 'primevue/button'
  import AutoComplete from 'primevue/autocomplete'
  import { useFieldArray } from 'vee-validate'
  import { computed, ref } from 'vue'

  defineOptions({
    name: 'edge-firewall-rules-engine-create-form-fields'
  })

  const DEFAULT_CRITERIA_OPTION = {
    variable: 'header_accept',
    operator: 'matches',
    conditional: 'if',
    input_value: ''
  }

  const { push: pushCriteria, remove: removeCriteria, fields: criteria } = useFieldArray('criteria')
  const conditionalMenuRef = ref({})
  const criteriaMenuRef = ref({})
  const criteriaVariableAutoCompleteFieldOptions = ref([
    'header_accept',
    'header_accept_encoding',
    'header_accept_language',
    'header_cookie',
    'header_origin',
    'header_referer',
    'header_user_agent',
    'host',
    'network',
    'request_args'
  ])
  const variableItems = ref([])

  const getOperatorsOptionsByCriteriaVariable = ({ criteriaIndex, criteriaInnerRowIndex }) => {
    const criteriaVariable = criteria.value[criteriaIndex].value[criteriaInnerRowIndex].variable

    switch (criteriaVariable) {
      case 'header_accept':
      case 'header_accept_encoding':
      case 'header_accept_language':
      case 'header_cookie':
      case 'header_origin':
      case 'header_referer':
      case 'header_user_agent':
      case 'network':
        return [
          { label: 'matches', value: 'matches' },
          { label: 'does not match', value: 'does_not_match' }
        ]
      case 'host':
        return [
          { label: 'is equal', value: 'is_equal' },
          { label: 'is not equal', value: 'is_not_equal' },
          { label: 'matches', value: 'matches' },
          { label: 'does not match', value: 'does_not_match' }
        ]
      case 'request_args':
        return [
          { label: 'is equal', value: 'is_equal' },
          { label: 'is not equal', value: 'is_not_equal' },
          { label: 'matches', value: 'matches' },
          { label: 'does not match', value: 'does_not_match' },
          { label: 'exists', value: 'exists' },
          { label: 'does not exist', value: 'does_not_exist' }
        ]
      default:
        break
    }

    ;[
      { label: 'is equal', value: 'is_equal' },
      { label: 'is not equal', value: 'is_not_equal' },
      { label: 'starts with', value: 'starts_with' },
      { label: 'does not start with', value: 'does_not_start_with' },
      { label: 'matches', value: 'matches' },
      { label: 'does not match', value: 'does_not_match' },
      { label: 'exists', value: 'exists' },
      { label: 'does not exist', value: 'does_not_exist' }
    ]
  }

  /**
   * Adds a new criteria with a default IF operator.
   */
  const addNewCriteria = () => {
    pushCriteria([DEFAULT_CRITERIA_OPTION])
  }

  /**
   * Adds a conditional AND/OR operator to the criteria at the specified index.
   * @param {number} index - The index of the criteria to add the operator to.
   * @param {("and"|"or")} operator - The operator to add to the criteria at the specified index.
   */
  const addConditional = ({ index, operator }) => {
    criteria.value[index].value.push({ ...DEFAULT_CRITERIA_OPTION, conditional: operator })
  }

  /**
   * Remove a specific conditional from the criteria array.
   * @param {number} criteriaIndex - The index of the criteria from which the conditional will be removed.
   * @param {number} conditionalIndex - The index of the conditional to be removed.
   */
  const removeCriteriaInnerRow = (criteriaIndex, conditionalIndex) => {
    criteria.value[criteriaIndex].value.splice(conditionalIndex, 1)
  }

  /**
   * @param {Object} positions
   * @param {number} positions.criteriaIndex - The index of the criteria from which the conditional will be removed.
   * @param {number} positions.conditionalIndex - The index of the conditional to be removed.
   * @returns {boolean}
   */
  const showInputValueBySelectedOperator = ({ criteriaIndex, criteriaInnerRowIndex }) => {
    const operator = criteria.value[criteriaIndex].value[criteriaInnerRowIndex].operator

    return operator !== 'exists' && operator !== 'does_not_exist'
  }

  /**
   * filter the variable autocomplete options based on the user's query.
   * @param {Object} event - The event object containing the user's query.
   * @param {string} event.query - The user's query.
   */
  const searchVariableOption = (event) => {
    variableItems.value = criteriaVariableAutoCompleteFieldOptions.value.filter((item) =>
      item.includes(event.query)
    )
  }

  /**
   * Checks if a criteria can be deleted.
   * @param {number} index - The index of the criteria.
   * @returns {boolean}
   */
  const isNotFirstCriteria = (index) => {
    return criteria.value.length > 1 && index < criteria.value.length - 1
  }

  /**
   * Checks if is the last criteria divider.
   * @param {number} criteriaIndex
   * @returns {boolean}
   */
  const isLastCriteriaSectionDivider = (criteriaIndex) => {
    return criteriaIndex !== criteria.value.length - 1
  }

  /**
   * Toggle the visibility of the conditional menu.
   * @param {Event} event - The event that triggered the function.
   * @param {number} index - The index of the criteria.
   * @param {number} conditionalIndex - The index of the conditional inside a criteria.
   */
  const toggleConditionalMenu = (event, index, conditionalIndex) => {
    conditionalMenuRef.value[`${index}${conditionalIndex}`].toggle(event)
  }

  /**
   * Toggle the visibility of the criteria menu.
   * @param {Event} event
   * @param {number} criteriaIndex
   */
  const toggleCriteriaMenu = ({ event, criteriaIndex }) => {
    criteriaMenuRef.value[criteriaIndex].toggle(event)
  }

  /**
   * @param {number} criteriaIndex
   * @param {number} [criteriaInnerRowIndex]
   * @returns {Array} options for the criteria menu available commands.
   */
  const criteriaMenuOptions = (criteriaIndex, criteriaInnerRowIndex = null) => {
    return [
      {
        label: 'Delete',
        icon: 'pi pi-fw pi-trash',
        severity: 'error',
        command: () => {
          if (criteriaInnerRowIndex === null) {
            removeCriteria(criteriaIndex)
          } else {
            removeCriteriaInnerRow(criteriaIndex, criteriaInnerRowIndex)
          }
        }
      }
    ]
  }

  const maximumConditionalsByCriteriaReached = (criteriaIndex) => {
    const MAXIMUM_ALLOWED = 10
    return criteria.value[criteriaIndex].value.length >= MAXIMUM_ALLOWED
  }

  const maximumCriteriaReached = computed(() => {
    const MAXIMUM_ALLOWED = 5
    return criteria.value.length >= MAXIMUM_ALLOWED
  })

  // Behaviors - extract to another form fields
  const {
    push: pushBehavior,
    remove: removeBehavior,
    fields: behaviors
  } = useFieldArray('behaviors')

  const behaviorsOptions = computed(() => {
    const currentBehaviors = behaviors.value.map((item) => item.value.name)
    const wafBehaviorIsAlreadySelected = currentBehaviors.includes('set_waf_ruleset')
    const runFunctionBehaviorIsAlreadySelected = currentBehaviors.includes('run_function')

    return [
      { value: 'deny', label: 'Deny (403 Forbidden)', disabled: false },
      { value: 'drop', label: 'Drop (Close Without Response)', disabled: false },
      { value: 'set_rate_limit', label: 'Set Rate Limit', disabled: false },
      {
        value: 'set_waf_ruleset',
        label: 'Set WAF Rule Set',
        disabled: wafBehaviorIsAlreadySelected
      },
      {
        value: 'run_function',
        label: 'Run Function',
        disabled: runFunctionBehaviorIsAlreadySelected
      },
      { value: 'tag_event', label: 'Tag Event', disabled: false },
      { value: 'set_custom_response', label: 'Set Custom Response', disabled: false }
    ]
  })
  const disableAddBehaviorButton = ref(true)
  const behaviorsMenuRef = ref({})

  const toggleBehaviorMenu = (event, behaviorItemIndex) => {
    behaviorsMenuRef.value[behaviorItemIndex].toggle(event)
  }

  const behaviorMenuOptions = (behaviorItemIndex) => {
    return [
      {
        label: 'Delete',
        icon: 'pi pi-fw pi-trash',
        severity: 'error',
        command: () => {
          removeBehavior(behaviorItemIndex)
        }
      }
    ]
  }

  const generateBehaviorLabelSection = (behaviorItem) => {
    return behaviorItem.isFirst ? 'Then' : 'And'
  }

  const handleAddBehavior = () => {
    const EMPTY_DEFAULT_BEHAVIOR = { name: '', target: {} }
    pushBehavior(EMPTY_DEFAULT_BEHAVIOR)
    disableAddBehaviorButton.value = true
  }

  const removeBehaviorsFromIndex = (startIndex) => {
    const endIndex = behaviors.value.length - 1
    for (let index = endIndex; index > startIndex; index--) {
      removeBehavior(index)
    }
  }

  const updateAndGenerateAvailableBehaviorsOptions = ({ selectedBehavior, behaviorItemIndex }) => {
    switch (selectedBehavior) {
      case 'deny':
      case 'drop':
      case 'set_rate_limit':
      case 'set_custom_response':
        // limpar behaviors posteriores ao seu index
        // desabilitar botão de adicionar behavior
        disableAddBehaviorButton.value = true
        removeBehaviorsFromIndex(behaviorItemIndex)
        // desabilita sua seleção , evitando behavior igual
        break
      case 'run_function':
      case 'set_waf_ruleset':
        // habilita botão de adicionar mais behavior
        // desabilita sua seleção , evitando behavior igual
        disableAddBehaviorButton.value = false
        break
      default:
        disableAddBehaviorButton.value = true
        break
    }
  }

  // watch(
  //   behaviors.value.length,
  //   (newValue) => {
  //     const selectedItems = newValue.map((item) => item.value.name)

  //     const wafBehaviorIsSelected = selectedItems.includes('set_waf_ruleset')
  //     const runFunctionBehaviorIsSelected = selectedItems.includes('run_function')

  //     behaviorsOptions.value.at(3).disabled = wafBehaviorIsSelected
  //     behaviorsOptions.value.at(4).disabled = runFunctionBehaviorIsSelected
  //   },
  //   {
  //     deep: true
  //   }
  // )
</script>
<template>
  <FormHorizontal
    title="General"
    description="Create a rule set to handle the conditional execution of behaviors through logical operators."
    :isDrawer="true"
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Name *"
          name="name"
          :value="name"
          description="Give a unique and descriptive name to identify the rule."
        />
      </div>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Description"
          name="description"
          :value="description"
          description="Add a short text that describes the rule to remember what it's used for or write another type of comment."
        />
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    :isDrawer="true"
    title="Criteria"
    description="Set the conditions to execute the rule. Select a variable from the list, the operator and, if prompted, enter the comparison string."
  >
    <template #inputs>
      <div
        class="flex flex-col"
        v-for="(criteriaItem, criteriaIndex) in criteria"
        :key="criteriaIndex"
      >
        <div
          v-for="(criteriaRow, criteriaInnerRowIndex) in criteriaItem.value"
          :key="criteriaInnerRowIndex"
        >
          <div class="flex items-center gap-2">
            <Divider
              align="left"
              type="dashed"
              class="capitalize"
            >
              {{ criteriaRow.conditional }}
            </Divider>

            <PrimeButton
              v-if="criteriaInnerRowIndex !== 0"
              icon="pi pi-ellipsis-h"
              size="small"
              outlined
              @click="(event) => toggleConditionalMenu(event, criteriaIndex, criteriaInnerRowIndex)"
            />
            <PrimeMenu
              :ref="(el) => (conditionalMenuRef[`${criteriaIndex}${criteriaInnerRowIndex}`] = el)"
              id="drawer_overlay_menu"
              :model="criteriaMenuOptions(criteriaIndex, criteriaInnerRowIndex)"
              :popup="true"
            />
          </div>

          <div class="flex items-top gap-x-2 items-top mt-2 mb-4 flex-col sm:flex-row">
            <div class="flex h-fit mt-2 sm:max-w-lg w-full gap-2">
              <div class="p-inputgroup">
                <div class="p-inputgroup-addon">
                  <i class="pi pi-dollar"></i>
                </div>
                <AutoComplete
                  :id="`criteria[${criteriaIndex}][${criteriaInnerRowIndex}].variable`"
                  v-model="criteria[criteriaIndex].value[criteriaInnerRowIndex].variable"
                  :suggestions="variableItems"
                  @complete="searchVariableOption"
                  :completeOnFocus="true"
                />
              </div>
            </div>

            <div class="flex flex-col sm:max-w-lg w-full gap-2">
              <FieldDropdown
                :options="
                  getOperatorsOptionsByCriteriaVariable({
                    criteriaIndex,
                    criteriaInnerRowIndex
                  })
                "
                optionLabel="label"
                optionValue="value"
                inputClass="w-full"
                :name="`criteria[${criteriaIndex}][${criteriaInnerRowIndex}].operator`"
                :value="criteria[criteriaIndex].value[criteriaInnerRowIndex].operator"
              />
            </div>

            <div class="flex flex-col sm:max-w-lg w-full gap-2">
              <FieldText
                v-if="showInputValueBySelectedOperator({ criteriaIndex, criteriaInnerRowIndex })"
                :name="`criteria[${criteriaIndex}][${criteriaInnerRowIndex}].input_value`"
                :value="criteria[criteriaIndex].value[criteriaInnerRowIndex].input_value"
                inputClass="w-full"
              />
            </div>
          </div>
        </div>

        <div class="flex gap-2 mb-8">
          <PrimeButton
            icon="pi pi-plus-circle"
            label="And"
            size="small"
            outlined
            :disabled="maximumConditionalsByCriteriaReached(criteriaIndex)"
            @click="addConditional({ index: criteriaIndex, operator: 'and' })"
          />
          <PrimeButton
            icon="pi pi-plus-circle"
            label="Or"
            size="small"
            outlined
            :disabled="maximumConditionalsByCriteriaReached(criteriaIndex)"
            @click="addConditional({ index: criteriaIndex, operator: 'or' })"
          />
        </div>

        <div class="flex items-center gap-2">
          <Divider
            v-if="isLastCriteriaSectionDivider(criteriaIndex)"
            align="left"
            type="solid"
            class="capitalize"
          >
            And
          </Divider>
          <Divider
            v-else
            align="left"
            type="solid"
          />

          <PrimeButton
            v-if="isNotFirstCriteria(criteriaIndex)"
            icon="pi pi-ellipsis-h"
            size="small"
            outlined
            @click="(event) => toggleCriteriaMenu({ event, criteriaIndex: criteriaIndex + 1 })"
          />
          <PrimeMenu
            :ref="(el) => (criteriaMenuRef[criteriaIndex + 1] = el)"
            id="drawer_overlay_menu"
            :model="criteriaMenuOptions(criteriaIndex + 1)"
            :popup="true"
          />
        </div>
      </div>

      <div>
        <PrimeButton
          :disabled="maximumCriteriaReached"
          icon="pi pi-plus-circle"
          label="Add Criteria"
          size="small"
          outlined
          @click="addNewCriteria"
        />
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    title="Behaviors"
    description="Set the behaviors you want your rule to perform if the conditions defined in the criteria are met. Select a behavior and all required information. Some actions can't be used together or in some conditions."
    :isDrawer="true"
  >
    <template #inputs>
      <div
        class="flex flex-col gap-2"
        v-for="(behaviorItem, behaviorItemIndex) in behaviors"
        :key="behaviorItem.key"
      >
        <div class="flex items-center gap-2">
          <Divider
            align="left"
            type="dashed"
          >
            {{ generateBehaviorLabelSection(behaviorItem) }}
          </Divider>

          <PrimeButton
            v-if="behaviorItemIndex !== 0"
            icon="pi pi-ellipsis-h"
            size="small"
            outlined
            @click="(event) => toggleBehaviorMenu(event, behaviorItemIndex)"
          />

          <PrimeMenu
            :ref="(el) => (behaviorsMenuRef[behaviorItemIndex] = el)"
            id="drawer_behavior_overlay_menu"
            :model="behaviorMenuOptions(behaviorItemIndex)"
            :popup="true"
          />
        </div>

        <div class="flex gap-2 mt-6 mb-8">
          <div class="w-1/2">
            <FieldDropdown
              :enableWorkaroundLabelToDisabledOptions="true"
              :key="behaviorItem.key"
              :name="`behaviors[${behaviorItemIndex}].name`"
              :options="behaviorsOptions"
              optionLabel="label"
              optionValue="value"
              optionDisabled="disabled"
              v-bind:value="behaviors[behaviorItemIndex].value.name"
              inputClass="w-full"
              @onChange="
                (selectedBehavior) =>
                  updateAndGenerateAvailableBehaviorsOptions({
                    selectedBehavior,
                    behaviorItemIndex
                  })
              "
            />
          </div>
        </div>
      </div>
      <Divider type="solid" />
      <div>
        <PrimeButton
          :disabled="disableAddBehaviorButton"
          icon="pi pi-plus-circle"
          label="Add Behavior"
          size="small"
          outlined
          @click="handleAddBehavior"
        />
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    title="Status"
    :isDrawer="true"
  >
    <template #inputs>
      <div class="flex w-full gap-3 items-start">
        <FieldSwitch
          name="active"
          label="Active"
        />
      </div>
    </template>
  </FormHorizontal>
</template>
