<script setup>
  import { computed, watch } from 'vue'
  import { useForm } from 'vee-validate'
  import * as yup from 'yup'
  import EmptyDrawer from '@/templates/empty-drawer'
  import ActionBarBlock from '@/templates/action-bar-block'
  import FieldText from '@aziontech/webkit/field-text'
  import FieldDropdownLazyLoader from '@aziontech/webkit/field-dropdown-lazy-loader'
  import Checkbox from '@aziontech/webkit/checkbox'
  import LabelBlock from '@aziontech/webkit/label'
  import { edgeAppService } from '@/services/v2/edge-app/edge-app-service'
  import { edgeFirewallService } from '@/services/v2/edge-firewall/edge-firewall-service'
  import { customPageService } from '@/services/v2/custom-page/custom-page-service'
  import { resourcePackTypeMeta } from '@/helpers/deployment-status'
  import { addMockDeployment } from '../helpers/mock-deployments'

  defineOptions({ name: 'create-deployment-drawer' })

  const SUPPORTED_RESOURCE_TYPES = ['application', 'firewall', 'customPage', 'function']

  const META_BY_KEY = Object.fromEntries(resourcePackTypeMeta.map((meta) => [meta.key, meta]))

  const noopListService = async () => ({ body: [], count: 0 })
  const noopLoadService = async () => ({ id: null, name: '' })

  const RESOURCE_SERVICES = {
    application: {
      list: edgeAppService.listEdgeApplicationsServiceDropdown,
      load: edgeAppService.loadEdgeApplicationService
    },
    firewall: {
      list: edgeFirewallService.listEdgeFirewallServiceDropdown,
      load: edgeFirewallService.loadEdgeFirewallService
    },
    customPage: {
      list: customPageService.listCustomPagesService,
      load: customPageService.loadCustomPagesService
    },
    function: {
      // TODO: wire to edgeFunctionService when exposed in v2
      list: noopListService,
      load: noopLoadService
    }
  }

  const resourceLabel = (key) => META_BY_KEY[key]?.label ?? key
  const resourceIcon = (key) => META_BY_KEY[key]?.icon ?? 'pi pi-cog'
  const resourceListService = (key) => RESOURCE_SERVICES[key]?.list ?? noopListService
  const resourceLoadService = (key) => RESOURCE_SERVICES[key]?.load ?? noopLoadService

  const props = defineProps({
    visible: { type: Boolean, default: false }
  })

  const emit = defineEmits(['update:visible', 'save', 'cancel'])

  const buildInitialValues = () => ({
    name: '',
    resourceTypes: [],
    resources: {}
  })

  const drawerSchema = yup.object({
    name: yup.string().required('Name is required').label('Name'),
    resourceTypes: yup
      .array()
      .of(yup.string())
      .min(1, 'Select at least one resource type'),
    resources: yup.object().default({})
  })

  const { handleSubmit, resetForm, values, setFieldValue } = useForm({
    validationSchema: drawerSchema,
    initialValues: buildInitialValues()
  })

  watch(
    () => props.visible,
    (isVisible) => {
      if (isVisible) resetForm({ values: buildInitialValues() })
    }
  )

  const visibleDrawer = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  const isResourceSelected = (key) => values.resourceTypes?.includes(key)

  const toggleResource = (key, checked) => {
    const current = Array.isArray(values.resourceTypes) ? [...values.resourceTypes] : []
    if (checked) {
      if (!current.includes(key)) current.push(key)
    } else {
      const idx = current.indexOf(key)
      if (idx >= 0) current.splice(idx, 1)
      const nextResources = { ...(values.resources || {}) }
      delete nextResources[key]
      setFieldValue('resources', nextResources)
    }
    setFieldValue('resourceTypes', current)
  }

  const setResourceValue = (key, value) => {
    setFieldValue('resources', { ...(values.resources || {}), [key]: value })
  }

  const onSave = handleSubmit((formValues) => {
    const deploymentId = addMockDeployment({
      name: formValues.name,
      resourceTypes: formValues.resourceTypes,
      resources: formValues.resources
    })
    emit('save', deploymentId)
    emit('update:visible', false)
  })

  const onCancel = () => {
    emit('cancel')
    emit('update:visible', false)
  }
</script>

<template>
  <EmptyDrawer
    v-model:visible="visibleDrawer"
    title="Create new Deployment"
  >
    <template #content>
      <form
        class="w-full flex flex-col gap-6"
        @submit.prevent="onSave"
      >
        <div class="flex flex-col gap-2">
          <LabelBlock
            label="Name"
            name="name"
            required
          />
          <FieldText
            name="name"
            placeholder="my-deployment"
            :value="values.name"
            data-testid="create-deployment-drawer__name-field"
          />
        </div>

        <div class="flex flex-col gap-3">
          <LabelBlock
            label="Resources"
            required
          />
          <small class="text-xs text-color-secondary leading-tight">
            Select which resource types this deployment will carry.
          </small>
          <div class="flex flex-col gap-2">
            <div
              v-for="resourceKey in SUPPORTED_RESOURCE_TYPES"
              :key="resourceKey"
              class="flex items-center gap-2"
            >
              <Checkbox
                :inputId="`resource-type-${resourceKey}`"
                :modelValue="isResourceSelected(resourceKey)"
                :binary="true"
                :data-testid="`create-deployment-drawer__type-${resourceKey}`"
                @update:modelValue="toggleResource(resourceKey, $event)"
              />
              <label
                :for="`resource-type-${resourceKey}`"
                class="flex items-center gap-2 cursor-pointer text-sm"
              >
                <i
                  :class="resourceIcon(resourceKey)"
                  class="text-color-secondary text-sm"
                />
                {{ resourceLabel(resourceKey) }}
              </label>
            </div>
          </div>
        </div>

        <div
          v-if="values.resourceTypes?.length"
          class="flex flex-col gap-4"
        >
          <h4 class="text-sm font-medium m-0">Configure resources</h4>
          <div
            v-for="resourceKey in values.resourceTypes"
            :key="resourceKey"
            class="flex flex-col gap-2"
          >
            <LabelBlock :label="resourceLabel(resourceKey)" />
            <FieldDropdownLazyLoader
              :name="`resource_${resourceKey}`"
              :service="resourceListService(resourceKey)"
              :loadService="resourceLoadService(resourceKey)"
              optionLabel="name"
              optionValue="value"
              :value="values.resources?.[resourceKey]"
              appendTo="self"
              :placeholder="`Select a ${resourceLabel(resourceKey)}`"
              :data-testid="`create-deployment-drawer__resource-${resourceKey}`"
              @update:modelValue="setResourceValue(resourceKey, $event)"
            />
          </div>
        </div>
      </form>
    </template>

    <template #footer>
      <ActionBarBlock
        :inDrawer="true"
        primaryActionLabel="Save"
        @onSubmit="onSave"
        @onCancel="onCancel"
      />
    </template>
  </EmptyDrawer>
</template>
