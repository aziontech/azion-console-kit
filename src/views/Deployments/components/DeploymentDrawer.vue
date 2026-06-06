<script setup>
  import { computed, ref, watch } from 'vue'
  import TabView from 'primevue/tabview'
  import TabPanel from '@aziontech/webkit/tabpanel'
  import EditDrawerBlock from '@templates/edit-drawer-block'
  import ActionBarBlock from '@/templates/action-bar-block'
  import FormFieldsDeployment from '@/views/Deployments/FormFields/FormFieldsDeployment.vue'
  import DeploymentVersionsList from '@/views/Deployments/components/DeploymentVersionsList.vue'
  import {
    loadDeploymentByIdAdapter,
    updateDeploymentAdapter
  } from '@/views/Deployments/Config/adapters'
  import { validationSchema } from '@/views/Deployments/Config/validation'

  defineOptions({ name: 'deployment-drawer' })

  const props = defineProps({
    visible: {
      type: Boolean,
      default: false
    },
    deploymentId: {
      type: [String, Number],
      required: true
    },
    initialTab: {
      type: String,
      default: 'versions'
    }
  })

  const emit = defineEmits(['update:visible', 'saved'])

  const TAB_ORDER = ['versions', 'settings']
  const TAB_TO_INDEX = TAB_ORDER.reduce((acc, name, index) => {
    acc[name] = index
    return acc
  }, {})

  const activeTab = ref(TAB_TO_INDEX[props.initialTab] ?? TAB_TO_INDEX.versions)

  const isSettingsTab = computed(() => activeTab.value === TAB_TO_INDEX.settings)

  const visibleDrawer = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  const editService = (values) => updateDeploymentAdapter(props.deploymentId, values)

  const handleSaved = (feedback) => {
    emit('saved', feedback)
  }

  watch(
    () => props.visible,
    (isVisible) => {
      if (isVisible) {
        activeTab.value = TAB_TO_INDEX[props.initialTab] ?? TAB_TO_INDEX.versions
      }
    }
  )
</script>

<template>
  <EditDrawerBlock
    :id="deploymentId"
    v-model:visible="visibleDrawer"
    :loadService="loadDeploymentByIdAdapter"
    :editService="editService"
    :schema="validationSchema"
    title="Deployment settings"
    @onSuccess="handleSaved"
  >
    <template #formFields>
      <TabView
        v-model:activeIndex="activeTab"
        class="w-full h-full"
      >
        <TabPanel
          header="Deployment versions"
          :pt="{ root: { 'data-testid': 'deployment-drawer__tab__versions' } }"
        >
          <DeploymentVersionsList :deploymentId="deploymentId" />
        </TabPanel>
        <TabPanel
          header="Settings"
          :pt="{ root: { 'data-testid': 'deployment-drawer__tab__settings' } }"
        >
          <FormFieldsDeployment isEdit />
        </TabPanel>
      </TabView>
    </template>

    <template #action-bar="{ onSubmit, onCancel, loading }">
      <ActionBarBlock
        v-if="isSettingsTab"
        :inDrawer="true"
        :loading="loading"
        @onSubmit="onSubmit"
        @onCancel="onCancel"
      />
    </template>
  </EditDrawerBlock>
</template>
