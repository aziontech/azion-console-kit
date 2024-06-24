<script setup>
  import { InternalServerError } from '@/services/axios/errors'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import PageLoadingBlock from '@/templates/loading-block'
  import TemplateEngineBlock from '@/templates/template-engine-block'
  import PrimeButton from 'primevue/button'
  import Divider from 'primevue/divider'
  import Dropdown from 'primevue/dropdown'
  import InlineMessage from 'primevue/inlinemessage'
  import Sidebar from 'primevue/sidebar'
  import Tag from 'primevue/tag'
  import { useField, useForm } from 'vee-validate'
  import { computed, ref, watch } from 'vue'
  import { useRouter } from 'vue-router'
  import * as yup from 'yup'
  import PermissionsFieldset from '../components/PermissionsFieldset'
  import FeedbackFish from '@/templates/navbar-block/feedback-fish'

  const router = useRouter()

  const emit = defineEmits([
    'update:visible',
    'success',
    'fail',
    'update:showSidebarSecond',
    'loading'
  ])

  const props = defineProps({
    visible: {
      type: Boolean,
      default: false
    },
    position: {
      type: String,
      default: 'right'
    },
    solution: {
      type: Object,
      required: true
    },
    availableApps: {
      type: Array,
      required: true,
      default: () => []
    },
    getTemplateService: {
      type: Function,
      required: true
    },
    instantiateTemplateService: {
      type: Function,
      required: true
    },
    checkStatusScriptRunnerService: {
      type: Function,
      required: true
    },
    windowOpen: {
      type: Function,
      required: true
    },
    showSidebarSecond: {
      type: Boolean,
      default: false
    },
    loadingEdges: {
      type: Boolean,
      default: false
    }
  })

  const HIDDEN_FIELDS_INITIAL = [
    {
      name: 'solution_slug',
      value: props.solution.slug
    },
    {
      name: 'edge_function_id',
      value: props.solution.referenceId
    },
    {
      name: 'solution_vendor',
      value: props.solution.vendor.slug
    },
    {
      name: 'solution_version',
      value: props.solution.latestVersion
    }
  ]

  const loading = ref(false)
  const freezeLoading = ref(true)
  const hiddenFields = ref([])
  const initialValues = { edgeApplication: '' }

  const validationSchema = yup.object({
    edgeApplication: yup.string().required()
  })
  const { errors, resetForm } = useForm({
    validationSchema,
    initialValues
  })

  const { value: edgeApplication } = useField('edgeApplication')

  const edgeApps = computed(() => {
    const eligibleEdgeApplicationsToInstall = props.availableApps.filter(
      (edgeApplication) => edgeApplication.elegibleForInstall
    )
    return eligibleEdgeApplicationsToInstall.map((app) => ({
      label: app.name,
      value: app.id,
      upgradeable: app.upgradeable
    }))
  })

  const toggleSidebar = (value) => {
    emit('update:visible', value)
  }

  const checkStatus = async ({ result, feedback }) => {
    let status
    try {
      const res = await props.checkStatusScriptRunnerService(result.uuid)
      status = res.status
    } catch (error) {
      emit('fail', error)
    }

    const stopStatusList = ['succeeded', 'failed', 'pending finish']

    if (!stopStatusList.includes(status)) {
      setTimeout(async () => {
        await checkStatus({ result, feedback })
      }, 800)

      return
    }

    if (status === 'succeeded') {
      emit('success', feedback)
    }

    if (status === 'failed' || status === 'pending finish') {
      emit('fail', InternalServerError().message)
    }

    freezeLoading.value = false
    loading.value = false
    resetForm()

    setTimeout(() => (freezeLoading.value = true), 100)
  }

  const handleLaunchSolution = async ({ result, feedback }) => {
    checkStatus({ result, feedback })
  }

  const handleCreateNew = () => {
    router.push('/edge-applications/create?origin=marketplace')
  }

  const handleLoading = () => {
    loading.value = true
    emit('loading')
  }

  const handleCancel = () => {
    resetForm()
    toggleSidebar()
  }

  const warnToCreate = computed(() => {
    return !props.loadingEdges && edgeApps.value.length === 0
  })

  const warnUpdate = computed(() => {
    const app = edgeApps.value.find((edgeApp) => edgeApp.value === edgeApplication.value)
    return app?.upgradeable
  })

  const styleRoot = computed(() => {
    return props.showSidebarSecond
      ? 'max-w-5xl w-full p-0 transition-all duration-300'
      : 'max-w-4xl w-full p-0 transition-all duration-300'
  })

  watch(edgeApplication, () => {
    const item = {
      name: 'edge_application_id',
      value: edgeApplication
    }
    hiddenFields.value = [...HIDDEN_FIELDS_INITIAL, item]
  })
</script>

<template>
  <Sidebar
    :visible="props.visible"
    @update:visible="toggleSidebar"
    :position="props.position"
    :pt="{
      root: { class: styleRoot },
      header: { class: 'px-8' },
      closeButton: { class: '' },
      headercontent: { class: 'flex justify-content-between items-center w-full pr-2' },
      content: { class: '[&::-webkit-scrollbar]:hidden p-0 flex flex-col justify-between' }
    }"
  >
    <template #header>
      <div>Install an Integration</div>
      <FeedbackFish />
    </template>
    <template #default>
      <div class="flex flex-col w-full md:p-8 pb-0 relative">
        <PageLoadingBlock
          :showLoading="loading"
          customClasses="top-0 left-0 z-10 mt-[3.5rem] h-[calc(100%-7rem)]"
        />

        <form class="w-full flex flex-col gap-8">
          <FormHorizontal
            :isDrawer="true"
            title="Select an edge application"
            description="Browse and select the desired edge application to install this integration."
          >
            <template #inputs>
              <div class="flex flex-col w-full sm:max-w-3xl gap-8">
                <div class="flex flex-col sm:max-w-lg w-full gap-2">
                  <label
                    for="edge_application"
                    class="text-color text-base font-medium"
                    >Edge Application *
                  </label>
                  <Dropdown
                    filter
                    autoFilterFocus
                    appendTo="self"
                    id="edge_application"
                    :disabled="warnToCreate"
                    :class="{ 'p-invalid': errors.edgeApplication }"
                    v-model="edgeApplication"
                    :options="edgeApps"
                    optionLabel="label"
                    optionValue="value"
                    class="w-full"
                    placeholder="Select an edge application"
                    filterIcon="pi pi-search"
                    emptyMessage="No edge application found with integrations to install or update."
                    :pt="{ emptyMessage: { class: 'text-sm' }, list: { class: 'pb-0' } }"
                    :loading="loadingEdges"
                  >
                    <template #option="slotProps">
                      <div class="w-full flex align-items-center justify-between">
                        <div>{{ slotProps.option.label }}</div>
                        <Tag
                          v-if="slotProps.option.upgradeable"
                          value="Update Available"
                          severity="info"
                        />
                      </div>
                    </template>
                    <template #footer>
                      <Divider class="mb-2" />
                      <div class="px-2">
                        <PrimeButton
                          label="Create New"
                          icon-pos="left"
                          icon="pi pi-plus-circle"
                          text
                          size="small"
                          class="w-full text-left mb-2 pl-2 py-2"
                          :pt="{
                            label: { class: 'font-normal' },
                            root: { class: 'rounded-md hover:surface-200' }
                          }"
                          @click="handleCreateNew"
                        />
                      </div>
                    </template>
                  </Dropdown>
                  <small
                    v-if="errors.edgeApplication"
                    class="p-error text-xs font-normal leading-tight"
                    >{{ errors.edgeApplication }}</small
                  >
                </div>
                <InlineMessage
                  v-if="warnUpdate"
                  severity="warn"
                  class="max-w-lg"
                  >Updating will create a new instance of the integration's function.</InlineMessage
                >

                <InlineMessage
                  v-if="warnToCreate"
                  severity="info"
                  class="max-w-lg"
                >
                  No edge application has been created. Go to
                  <PrimeButton
                    class="p-0"
                    label="Edge Application"
                    link
                    size="small"
                    @click="handleCreateNew"
                  />
                  to create a new one.
                </InlineMessage>
              </div>
            </template>
          </FormHorizontal>

          <template v-if="edgeApplication">
            <form autocomplete="off">
              <TemplateEngineBlock
                :getTemplateService="getTemplateService"
                :instantiateTemplateService="instantiateTemplateService"
                :templateId="solution.latestVersionInstallTemplate"
                :hiddenFields="hiddenFields"
                :freezeLoading="freezeLoading"
                :isDrawer="true"
                actionBarId="#action-bar-integration"
                @instantiate="handleLaunchSolution"
                @loading="handleLoading"
                @cancel="handleCancel"
              />

              <PermissionsFieldset
                :permissions="solution.permission"
                :windowOpen="props.windowOpen"
              />
            </form>
          </template>
        </form>
      </div>
      <div
        id="action-bar-integration"
        class="sticky bottom-0 z-20"
      ></div>
    </template>
  </Sidebar>
</template>
