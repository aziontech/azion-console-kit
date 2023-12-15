<script setup>
  import { computed, ref, watch } from 'vue'
  import Sidebar from 'primevue/sidebar'
  import Tag from 'primevue/tag'
  import PrimeButton from 'primevue/button'
  import Dropdown from 'primevue/dropdown'
  import Divider from 'primevue/divider'
  import InlineMessage from 'primevue/inlinemessage'
  import ProgressBar from 'primevue/progressbar'
  import { useField, useForm } from 'vee-validate'
  import * as yup from 'yup'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import TemplateEngineBlock from '@/templates/template-engine-block'
  import { InternalServerError } from '@/services/axios/errors'
  import PermissionsFieldset from '../components/PermissionsFieldset'

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
    const apps = props.availableApps.filter((i) => i.elegibleForInstall)
    return apps.map((app) => ({
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
    emit('update:showSidebarSecond', true)
  }

  const handleLoading = () => {
    loading.value = true
    emit('loading')
  }

  const handleCancel = () => {
    resetForm()
    toggleSidebar()
  }

  const warnUpdate = computed(() => {
    const app = edgeApps.value.find((i) => i.value === edgeApplication.value)
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
      content: { class: '[&::-webkit-scrollbar]:hidden p-0 flex flex-col justify-between' }
    }"
  >
    <template #header>
      <div>Installing integration</div>
    </template>
    <template #default>
      <div class="flex flex-col w-full md:p-8 pb-0 relative">
        <div
          class="bg-black/20 z-10 mt-[3.5rem] h-[calc(100%-7rem)] cursor-progress fixed w-full top-0 left-0"
          v-if="loading"
        >
          <ProgressBar
            class="sticky"
            mode="indeterminate"
            style="height: 0.375rem"
          ></ProgressBar>
        </div>
        <form class="w-full flex flex-col gap-8">
          <FormHorizontal
            :isDrawer="true"
            title="Select a Edge Application to install"
            description="Select in which Edge Application you want to install this solution."
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
                    id="edge_application"
                    :class="{ 'p-invalid': errors.edgeApplication }"
                    v-model="edgeApplication"
                    :options="edgeApps"
                    optionLabel="label"
                    optionValue="value"
                    class="w-full"
                    placeholder="Select an edge application"
                    filter
                    filterIcon="pi pi-search"
                    emptyMessage="No applications with integrations to install or update."
                    :pt="{ emptyMessage: { class: 'text-sm' }, list: { class: 'pb-0' } }"
                    :loading="loadingEdges"
                  >
                    <template #option="slotProps">
                      <div class="w-full flex align-items-center justify-between">
                        <div>{{ slotProps.option.label }}</div>
                        <Tag
                          v-if="slotProps.option.upgradeable"
                          value="Update available"
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
                  >Updating will create a new instance of the provided integration
                  function.</InlineMessage
                >
              </div>
            </template>
          </FormHorizontal>

          <template v-if="edgeApplication">
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
