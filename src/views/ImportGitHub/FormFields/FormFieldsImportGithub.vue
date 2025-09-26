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
  import { useRouter } from 'vue-router'
  import { windowOpen } from '@/helpers'
  import LabelBlock from '@/templates/label-block'
  import { vcsService } from '@/services/v2/vcs/vcs-service'

  const toast = useToast()
  const router = useRouter()

  const props = defineProps({
    listVulcanPresetsService: {
      type: Function
    },
    frameworkDetectorService: {
      type: Function
    }
  })

  const AZIONFORMSAMPLESLINK = ref('https://github.com/aziontech/azion-samples/fork')
  const { value: preset } = useField('preset')
  const { value: gitScope } = useField('gitScope')
  const { value: repository } = useField('repository')
  const { value: applicationName } = useField('applicationName')
  const { value: rootDirectory } = useField('rootDirectory')
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
  const presetsList = ref([])

  const setCallbackUrl = (uri) => {
    callbackUrl.value = uri
  }
  const saveIntegration = async (integration) => {
    try {
      isGithubConnectLoading.value = true
      await vcsService.postCallbackUrl(callbackUrl.value, integration.data)
      await loadListIntegrations()
    } catch (error) {
      error.showWithOptions(toast, (error) => ({
        summary: `Save failed ${error.detail}`,
        severity: 'error'
      }))
    } finally {
      isGithubConnectLoading.value = false
    }
  }

  const listenerOnMessage = () => {
    window.addEventListener('message', (event) => {
      if (event.data.event === 'integration-data') {
        saveIntegration(event.data)
      }
    })
  }

  const integrationsList = ref([])
  const loadListIntegrations = async () => {
    try {
      isGithubConnectLoading.value = true
      const data = await vcsService.listIntegrations()
      integrationsList.value = data
    } catch (error) {
      error.showWithOptions(toast, { summary: 'Listing failed' })
    } finally {
      isGithubConnectLoading.value = false
    }
  }

  const hasIntegrations = computed(() => {
    if (integrationsList?.value?.length > 0) return true
    return false
  })

  const repositoriesList = ref([])
  const loadingRepositories = ref(false)
  const setListRepositories = async () => {
    try {
      repositoriesList.value = []
      loadingRepositories.value = true
      const data = await vcsService.listRepositories(gitScope.value)
      repositoriesList.value = data
    } catch (error) {
      error.showWithOptions(toast, { summary: 'Loading failed' })
    } finally {
      loadingRepositories.value = false
    }
  }

  const detectAndSetFrameworkPreset = async (accountName, repositoryName) => {
    try {
      const framework = await props.frameworkDetectorService({
        accountName,
        repositoryName
      })
      preset.value = framework
    } catch (error) {
      toast.add({
        closable: true,
        severity: 'error',
        summary: 'Setting failed',
        detail: error
      })
    }
  }

  const setEdgeApplicationNameByRepository = async (repositoryName) => {
    applicationName.value = `${repositoryName}`

    const accountName = getOptionNameByValue({
      listOption: integrationsList.value,
      optionValue: gitScope.value,
      key: 'value'
    })

    await detectAndSetFrameworkPreset(accountName, repositoryName)
  }

  const oauthGithubRef = ref(null)
  const triggerConnectWithGithub = () => {
    if (oauthGithubRef.value) {
      oauthGithubRef.value.connectWithGithub()
    }
  }

  const getOptionNameByValue = ({ listOption, optionValue, key }) => {
    const selectedOption = listOption.find((integration) => integration[key] === optionValue)
    return selectedOption ? selectedOption.label : ''
  }

  const goToVariablesPage = () => {
    const route = router.resolve({ name: 'variables' })
    windowOpen(route.href, '_blank')
  }

  const goToAzionSamples = () => {
    windowOpen(AZIONFORMSAMPLESLINK.value, '_blank')
  }

  onMounted(async () => {
    await loadListIntegrations()
    listenerOnMessage()
    presetsList.value = await props.listVulcanPresetsService()
  })

  const getPresetIconClass = (preset) => {
    return `ai ai-${preset}`
  }
</script>

<template>
  <FormHorizontal title="GitHub Connection">
    <template #description>
      Provide access to GitHub to import an existing project.
      <PrimeButton
        link
        icon-pos="right"
        icon="pi pi-external-link"
        label="Fork and use a sample project"
        class="w-fit p-0 text-sm"
        @click="goToAzionSamples"
      />
    </template>
    <template #inputs>
      <div v-show="!hasIntegrations">
        <OAuthGithub
          ref="oauthGithubRef"
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
          <LabelBlock
            for="gitScope"
            label="Git Scope"
            isRequired
          />
          <Dropdown
            name="gitScope"
            v-model="gitScope"
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
                class="flex items-center"
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
                class="flex items-center"
                v-else
              >
                <i class="pi pi-github mr-2"></i>
                {{ slotProps.placeholder }}
              </div>
            </template>
            <template #option="slotProps">
              <div class="flex items-center">
                <i class="pi pi-github mr-2"></i>
                <div>{{ slotProps.option.label }}</div>
              </div>
            </template>
            <template #footer>
              <div class="p-dropdown-items-wrapper">
                <ul class="p-dropdown-items">
                  <li
                    class="p-dropdown-item flex items-center"
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
            optionValue="url"
            filter
            :disabled="!gitScope"
            placeholder="Select a repository"
            label="Repository"
            required
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
          label="Application Name"
          required
          name="applicationName"
          :value="applicationName"
          description="Give a unique name to the Application. It’ll also be used for the bucket for storage and the function."
        />
      </div>

      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <div class="flex flex-col gap-2">
          <LabelBlock
            for="preset"
            label="Preset"
            isRequired
          />
          <Dropdown
            name="preset"
            v-model="preset"
            :options="presetsList"
            filter
            optionLabel="label"
            optionValue="value"
            autoFilterFocus
            placeholder="Select a framework preset"
            class="w-full md:w-14rem"
          >
            <template #value="slotProps">
              <div
                v-if="slotProps.value"
                class="flex items-center"
              >
                <i
                  :class="getPresetIconClass(slotProps.value)"
                  class="mr-2"
                ></i>
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
              <div v-else>
                {{ slotProps.placeholder }}
              </div>
            </template>
            <template #option="slotProps">
              <div class="flex items-center">
                <i
                  :class="getPresetIconClass(slotProps.option.value)"
                  class="mr-2"
                ></i>
                <div>{{ slotProps.option.label }}</div>
              </div>
            </template>
          </Dropdown>
          <small class="text-xs text-color-secondary font-normal leading-5">
            Defines the initial settings to work with web frameworks.
          </small>
        </div>
      </div>

      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Root Directory"
          required
          name="rootDirectory"
          placeholder="/"
          :value="rootDirectory"
        />
      </div>

      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Install Command"
          required
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
              @click="removeVariable(index)"
            />
          </div>
          <div class="flex gap-4">
            <div class="flex flex-col sm:max-w-lg w-full gap-2">
              <FieldText
                label="Key"
                required
                autocapitalize="characters"
                :name="`newVariables[${index}].key`"
                :value="newVariables[index].key"
                placeholder="VARIABLE_KEY_NAME"
              />
              <small class="text-xs text-color-secondary font-normal leading-5">
                Give a name or identifier for the variable. Accepts upper-case letters, numbers, and
                underscore.
              </small>
            </div>
            <div class="flex flex-col sm:max-w-lg w-full gap-2">
              <FieldText
                label="Value"
                required
                :name="`newVariables[${index}].value`"
                :value="newVariables[index].value"
                placeholder="VARIABLE_VALUE"
              />
              <small class="text-xs text-color-secondary font-normal leading-5">
                Enter the data associated with the variable key.
              </small>
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
          @click="goToVariablesPage"
        />
      </div>
    </template>
  </FormHorizontal>
</template>
