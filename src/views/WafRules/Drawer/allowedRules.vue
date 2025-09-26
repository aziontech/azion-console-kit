<!-- eslint-disable no-useless-escape -->
<template>
  <CreateDrawerBlock
    data-testid="allow-rules-drawer"
    v-model:visible="visibleDrawer"
    :createService="handleSubmitAllowRules"
    :schema="validationSchema"
    :initialValues="initialValues"
    drawerId="allow-rules-drawer"
    @onSuccess="handleCreateWithSuccess"
    @onResponseFail="handleTrackFailedCreation"
    title="Allowing Rules"
    v-if="visible"
  >
    <template #formFields>
      <div class="flex flex-col gap-6">
        <FormHorizontal
          isDrawer
          title="Type"
          description="Choose how to refine and allow rules to address false positives effectively."
        >
          <template #inputs>
            <div class="flex flex-col gap-6">
              <FieldGroupRadio
                nameField="typeOption"
                isCard
                :options="typeOptionsRadios"
                @onRadioChange="handleRadioChange"
                data-testid="allow-rules-drawer__type-option"
              >
                <template #footer="{ item }">
                  <PrimeTag
                    v-if="moreThanOneItemWasSelected && item.inputValue === 'path_regex'"
                    value="This option is blocked when more than one field is selected"
                    icon="pi pi-lock"
                    severity="info"
                    class="mt-3 opacity-100"
                  />
                </template>
              </FieldGroupRadio>
            </div>
            <div
              class="flex flex-col md:flex-row justify-between gap-8"
              v-if="showPathRegexField"
            >
              <div class="flex flex-col gap-5 w-full">
                <div class="flex flex-col sm:max-w-sm gap-2">
                  <FieldText
                    data-testid="allow-rules-drawer__path-regex"
                    label="Path Regex"
                    required
                    name="pathRegex"
                    @input="handlePathRegexInput"
                    placeholder="/user/\d+/details"
                    :description="getRegexDescription()"
                  />
                </div>
                <RegexExamples class="hidden md:block" />
                <TopPaths
                  :topPaths="topPaths"
                  class="block md:hidden"
                />
              </div>
              <RegexExamples class="block md:hidden" />
              <TopPaths
                :topPaths="topPaths"
                class="hidden md:block"
              />
            </div>
          </template>
        </FormHorizontal>
        <FormHorizontal
          title="Context"
          isDrawer
          description="Add a short description or comment to explain the reason this rule was allowed."
        >
          <template #inputs>
            <div class="flex flex-col sm:max-w-lg w-full gap-2">
              <FieldTextarea
                label="Description"
                :placeholder="getPlaceholder()"
                name="name"
                rows="4"
                required
                data-testid="allow-rules-drawer__description"
              />
            </div>
          </template>
        </FormHorizontal>
      </div>
    </template>
  </CreateDrawerBlock>
</template>

<script setup>
  import { ref, computed, watch } from 'vue'
  import CreateDrawerBlock from '@templates/create-drawer-block'
  import * as yup from 'yup'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldTextarea from '@/templates/form-fields-inputs/fieldTextArea'
  import FieldGroupRadio from '@/templates/form-fields-inputs/fieldGroupRadio'
  import PrimeTag from 'primevue/tag'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import { pathRegexSchema } from '@/views/WafRules/Config/regexValidator'
  import TopPaths from './components/topPaths.vue'
  import RegexExamples from './components/regexExamples.vue'

  defineOptions({
    name: 'allowed-rules-details'
  })

  const props = defineProps({
    visible: {
      type: Boolean,
      default: false
    },
    allowedByAttacks: {
      type: Array,
      default: () => []
    },
    handleSubmitAllowRules: {
      type: Function,
      required: true
    }
  })

  const emit = defineEmits(['update:visible', 'closeDrawer', 'handleDescriptionOfAttack'])

  const validationSchema = yup.object({
    typeOption: yup.string().required('Type option is required'),
    name: yup.string().required('Description is required'),
    pathRegex: yup.string().when('typeOption', {
      is: 'path_regex',
      then: () => pathRegexSchema.required('Path regex is required'),
      otherwise: (schema) => schema.notRequired()
    })
  })

  const initialValues = ref({
    typeOption: 'fields',
    name: '',
    pathRegex: ''
  })

  const currentTypeOption = ref('fields')
  const pathMatches = ref({})
  const pathRegexValue = ref('')

  const closeDrawer = () => {
    currentTypeOption.value = 'fields'
    emit('closeDrawer')
  }

  const handleRadioChange = (value) => {
    currentTypeOption.value = value
  }

  const handleCreateWithSuccess = () => {
    closeDrawer()
  }

  const getPlaceholder = () => {
    return `e.g., False positive for query parameter 'item_value' affecting multiple paths.`
  }

  const handlePathRegexInput = (event) => {
    pathRegexValue.value = event.target.value
    updatePathMatches(event.target.value)
  }

  const getRegexDescription = () => {
    if (!pathRegexValue.value) {
      return 'Enter a regex pattern to see matching paths.'
    }

    const matchedCount = Object.values(pathMatches.value).filter((result) => result?.isMatch).length
    const totalCount = Object.keys(pathMatches.value).length

    if (totalCount === 0) {
      return 'No paths to match against.'
    }

    return `${matchedCount} of ${totalCount} paths match your regex pattern.`
  }

  const moreThanOneItemWasSelected = computed(() => props.allowedByAttacks.length > 1)

  const typeOptionsRadios = computed(() => [
    {
      title: 'Fields',
      subtitle:
        'Allow rules based on the selected fields (e.g., query parameters or headers). This option simplifies the process by grouping related paths into a single rule.',
      inputValue: 'fields'
    },
    {
      title: 'Path Regex',
      subtitle:
        'Use a pattern to allow rules for multiple paths that follow a similar structure. This option is useful when paths share predictable patterns.',
      inputValue: 'path_regex',
      disabled: moreThanOneItemWasSelected.value
    }
  ])

  const visibleDrawer = computed({
    get: () => props.visible,
    set: (value) => {
      closeDrawer()
      emit('update:visible', value)
    }
  })

  const showPathRegexField = computed(() => {
    return currentTypeOption.value === 'path_regex'
  })

  const topPaths = computed(() => {
    return props.allowedByAttacks.flatMap((attack) => {
      return attack.topPaths.map((topPath) => {
        const [path, hits, rest] = topPath.split(' ')
        const matchResult = pathMatches.value[path]
        return {
          path: path,
          hits: `${hits} ${rest}`,
          isMatched: matchResult?.isMatch || false,
          matchInfo: matchResult?.matchInfo || null
        }
      })
    })
  })

  const validatePathAgainstRegex = (path, regex) => {
    if (!regex || !path) return { isMatch: false, matchInfo: null }

    try {
      const regexObj = new RegExp(regex)
      const match = path.match(regexObj)

      if (match) {
        return {
          isMatch: true,
          matchInfo: {
            fullMatch: match[0],
            startIndex: match.index,
            endIndex: match.index + match[0].length,
            matchedPart: match[0],
            beforeMatch: path.substring(0, match.index),
            afterMatch: path.substring(match.index + match[0].length)
          }
        }
      }

      return { isMatch: false, matchInfo: null }
    } catch (error) {
      return { isMatch: false, matchInfo: null }
    }
  }

  const updatePathMatches = (regex) => {
    const matches = {}
    const allPaths = props.allowedByAttacks.flatMap((attack) =>
      attack.topPaths.map((topPath) => topPath.split(' ')[0])
    )

    allPaths.forEach((path) => {
      const result = validatePathAgainstRegex(path, regex)
      matches[path] = result
    })

    pathMatches.value = matches
  }

  watch(currentTypeOption, (newType) => {
    if (newType === 'path_regex' && pathRegexValue.value) {
      updatePathMatches(pathRegexValue.value)
    } else {
      pathMatches.value = {}
    }
  })
</script>
