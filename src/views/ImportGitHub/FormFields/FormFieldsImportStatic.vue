<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import FieldDropdown from '@/templates/form-fields-inputs/fieldDropdown'
  import PrimeButton from 'primevue/button'
  import Dropdown from 'primevue/dropdown'
  import Divider from 'primevue/divider'
  import OAuthGithub from '@/templates/template-engine-block/oauth-github.vue'
  import { ref, onMounted, computed } from 'vue'
  import { useField } from 'vee-validate'
  import { useToast } from 'primevue/usetoast'

  const toast = useToast()

  const props = defineProps({
    listPlatformsService: {
      type: Function
    },
    postCallbackUrlService: {
      type: Function
    },
    listIntegrationsService: {
      type: Function
    },
    listRepositoriesService: {
      type: Function
    },
    listVulcanPresetsService: {
      type: Function
    },
    getModesByPresetService: {
      type: Function
    }
  })

  const { value: preset } = useField('preset')
  const { value: selectedScope } = useField('selectedScope')
  const { value: repository } = useField('repository')
  const { value: edgeApplicationName } = useField('edgeApplicationName')
  const { value: rootDirectory } = useField('rootDirectory')
  const { value: mode } = useField('mode')
  const { value: installCommand } = useField('installCommand')
  const { value: newVariables } = useField('newVariables')

  const addVariable = () => {
    if (!Array.isArray(newVariables.value)) {
      newVariables.value = []
    }
    newVariables.value.push({
      key: '',
      value: ''
    })
  }

  const removeVariable = (index) => {
    newVariables.value.splice(index, 1)
  }

  const callbackUrl = ref('')
  const isGithubConnectLoading = ref(false)

  const setCallbackUrl = (uri) => {
    callbackUrl.value = uri
  }
  const saveIntegration = async (integration) => {
    isGithubConnectLoading.value = true
    await props.postCallbackUrlService(callbackUrl.value, integration.data)
  }

  const listenerOnMessage = () => {
    window.addEventListener('message', (event) => {
      if (event.data.event === 'integration-data') {
        saveIntegration(event.data)
      }
    })
  }

  const integrationsList = ref([])
  const listIntegrations = async () => {
    try {
      isGithubConnectLoading.value = true
      const data = await props.listIntegrationsService()

      integrationsList.value = data
    } catch (error) {
      toast.add({
        closable: true,
        severity: 'error',
        summary: error
      })
    } finally {
      isGithubConnectLoading.value = false
    }
  }

  const hasIntegrations = computed(() => {
    if (integrationsList?.value?.length > 0) return true
    return false
  })

  const presetsList = computed(() => {
    return props.listVulcanPresetsService()
  })

  const repositoriesList = ref([])
  const loadingRepositories = ref(false)
  const setListRepositories = async () => {
    try {
      loadingRepositories.value = true
      const data = await props.listRepositoriesService(selectedScope.value)
      repositoriesList.value = data
    } catch (error) {
      toast.add({
        closable: true,
        severity: 'error',
        summary: error
      })
    } finally {
      loadingRepositories.value = false
    }
  }

  const setModeByPreset = async () => {
    mode.value = await props.getModesByPresetService(preset.value)
  }
  const setEdgeApplicationNameByRepository = (repositoryName) => {
    edgeApplicationName.value = repositoryName
  }

  const oauthGithubRef = ref(null)
  const triggerConnectWithGithub = () => {
    if (oauthGithubRef.value) {
      oauthGithubRef.value.connectWithGithub()
    }
  }

  function getOptionNameByValue({ listOption, optionValue, key }) {
    const selectedOption = listOption.find((integration) => integration[key] === optionValue)
    return selectedOption ? selectedOption.label : ''
  }

  onMounted(async () => {
    await listIntegrations()
    listenerOnMessage()
  })
</script>

<template>
  <FormHorizontal
    title="GitHub Connection"
    description="Provide access to GitHub to import an existing project."
  >
    <template #inputs>
      <div v-show="!hasIntegrations">
        <OAuthGithub
          ref="oauthGithubRef"
          :listPlatformsService="listPlatformsService"
          @onCallbackUrl="
            (uri) => {
              setCallbackUrl(uri.value)
            }
          "
          :loading="isGithubConnectLoading"
        />
      </div>
      <div
        v-if="!!hasIntegrations"
        class="flex flex-col sm:flex-row gap-4"
      >
        <div class="flex flex-col sm:w-2/5 gap-2">
          <label
            for="gitScope"
            class="text-color text-sm font-medium leading-5"
            >Git Scope *</label
          >
          <Dropdown
            name="gitScope"
            v-model="selectedScope"
            :options="integrationsList"
            optionLabel="label"
            optionValue="value"
            placeholder="Select a scope"
            class="w-full md:w-14rem"
            @change="setListRepositories"
          >
            <template #value="slotProps">
              <div
                v-if="slotProps.value"
                class="flex align-items-center"
              >
                <i class="pi pi-github mr-2"></i>
                <div>
                  {{
                    getOptionNameByValue({
                      listOption: integrationsList,
                      optionValue: slotProps.value,
                      key: 'value'
                    })
                  }}
                </div>
              </div>
              <div
                class="flex align-items-center"
                v-else
              >
                <i class="pi pi-github mr-2"></i>
                {{ slotProps.placeholder }}
              </div>
            </template>
            <template #option="slotProps">
              <div class="flex align-items-center">
                <i class="pi pi-github mr-2"></i>
                <div>{{ slotProps.option.label }}</div>
              </div>
            </template>
            <template #footer>
              <div class="p-dropdown-items-wrapper">
                <ul class="p-dropdown-items">
                  <li
                    class="p-dropdown-item flex align-items-center"
                    @click="triggerConnectWithGithub"
                  >
                    <i class="pi pi-plus-circle mr-2"></i>
                    <div>Add GitHub Account</div>
                  </li>
                </ul>
              </div>
            </template>
          </Dropdown>
        </div>
        <div class="flex flex-col sm:w-2/5 gap-2">
          <FieldDropdown
            :options="repositoriesList"
            optionLabel="name"
            optionValue="id"
            filter
            :disabled="!repositoriesList"
            placeholder="Select a repository"
            label="Repository *"
            name="repository"
            :value="repository"
            :loading="loadingRepositories"
            @onSelectOption="
              (option) => {
                setEdgeApplicationNameByRepository(option.name)
              }
            "
          />
        </div>
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    title="General"
    description="Define the main settings for the project to be deployed on Azion's edge."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Edge Application Name *"
          name="edgeApplicationName"
          :value="edgeApplicationName"
        />
      </div>

      <div class="flex flex-col sm:flex-row gap-4">
        <div class="flex flex-col sm:w-2/5 gap-2">
          <label
            for="preset"
            class="text-color text-sm font-medium leading-5"
            >Preset *</label
          >
          <Dropdown
            name="preset"
            v-model="preset"
            :options="presetsList"
            filter
            optionLabel="label"
            optionValue="value"
            placeholder="Select a framework preset"
            class="w-full md:w-14rem"
            @change="setModeByPreset"
          >
            <template #value="slotProps">
              <div
                v-if="slotProps.value"
                class="flex align-items-center"
              >
                <i class="ai ai-vite mr-2"></i>
                <div>
                  {{
                    getOptionNameByValue({
                      listOption: presetsList,
                      optionValue: slotProps.value,
                      key: 'value'
                    })
                  }}
                </div>
              </div>
              <div
                class="flex align-items-center"
                v-else
              >
                <i class="ai ai-vite mr-2"></i>
                {{ slotProps.placeholder }}
              </div>
            </template>
            <template #option="slotProps">
              <div class="flex align-items-center">
                <i class="ai ai-vite mr-2"></i>
                <div>{{ slotProps.option.label }}</div>
              </div>
            </template>
          </Dropdown>
        </div>
        <div class="flex flex-col sm:w-2/5 gap-2">
          <FieldText
            label="Mode *"
            name="mode"
            placeholder=".next"
            :value="mode"
          />
        </div>
      </div>

      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Root Directory *"
          name="rootDirectory"
          placeholder="./"
          :value="rootDirectory"
        />
      </div>

      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Install Command *"
          name="installCommand"
          placeholder="npm install"
          :value="installCommand"
        />
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    title="Variables"
    description="Add project variables as needed. Use them as global variables and edit or turn them into secrets on the Variables page."
  >
    <template #inputs>
      <template v-if="newVariables?.length">
        <div
          v-for="(variable, index) in newVariables"
          class="flex flex-col gap-5"
          :key="index"
        >
          <div class="flex items-center gap-3">
            <Divider
              class="px-3 z-0"
              align="left"
              type="dashed"
            >
              New Variable
            </Divider>
            <PrimeButton
              class="h-8 max-sm:w-full position-absolute right-0 top-0"
              icon="pi pi-trash"
              outlined
              type="button"
              aria-label="Remove Origin"
              @click="removeVariable(index)"
            />
          </div>
          <div class="flex gap-4">
            <div class="flex flex-col sm:max-w-lg w-full gap-2">
              <FieldText
                label="Key *"
                :name="`newVariables[${index}].key`"
                :value="newVariables[index].key"
              />
            </div>
            <div class="flex flex-col sm:max-w-lg w-full gap-2">
              <FieldText
                label="Value *"
                :name="`newVariables[${index}].value`"
                :value="newVariables[index].value"
              />
            </div>
          </div>
        </div>

        <Divider />
      </template>

      <div class="flex flex-col sm:flex-row gap-4">
        <PrimeButton
          icon="pi pi-plus-circle"
          outlined
          label="Variable"
          @click="addVariable"
        />
        <PrimeButton
          link
          icon-pos="right"
          icon="pi pi-external-link"
          label="View All Variables"
          @click="addVariable"
        />
      </div>
    </template>
  </FormHorizontal>
</template>
