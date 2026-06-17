<script setup>
  import { ref, watch } from 'vue'
  import Sidebar from '@aziontech/webkit/sidebar'
  import PrimeButton from '@aziontech/webkit/button'
  import InputText from '@aziontech/webkit/inputtext'
  import Dropdown from '@aziontech/webkit/dropdown'
  import { useToast } from '@aziontech/webkit/use-toast'
  import {
    createEnvironmentService,
    updateEnvironmentService
  } from '@/services/v2/environment/environment-mock'

  defineOptions({ name: 'environment-drawer' })

  const props = defineProps({
    isEditing: {
      type: Boolean,
      default: false
    },
    environment: {
      type: Object,
      default: null
    }
  })

  const emit = defineEmits(['save'])

  const toast = useToast()
  const visible = ref(false)
  const loading = ref(false)

  const form = ref({
    name: '',
    status: 'active',
    configuration: 'single_version'
  })

  const statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' }
  ]

  const configurationOptions = [
    { label: 'Single Version', value: 'single_version' },
    { label: 'Versioned URLs', value: 'versioned_urls' }
  ]

  // Helper to extract status value from object or string
  const getStatusValue = (status) => {
    if (typeof status === 'object' && status !== null) {
      return status.content?.toLowerCase() === 'active' ? 'active' : 'inactive'
    }
    return status || 'active'
  }

  // Helper to extract configuration value from object or string
  const getConfigurationValue = (config) => {
    if (typeof config === 'object' && config !== null) {
      return config.content?.toLowerCase().includes('versioned')
        ? 'versioned_urls'
        : 'single_version'
    }
    return config || 'single_version'
  }

  watch(
    () => props.environment,
    (newEnv) => {
      if (newEnv) {
        form.value = {
          name: newEnv.name,
          status: getStatusValue(newEnv.status),
          configuration: getConfigurationValue(newEnv.configuration)
        }
      } else {
        form.value = {
          name: '',
          status: 'active',
          configuration: 'single_version'
        }
      }
    }
  )

  const open = () => {
    visible.value = true
    if (props.environment) {
      form.value = {
        name: props.environment.name,
        status: getStatusValue(props.environment.status),
        configuration: getConfigurationValue(props.environment.configuration)
      }
    } else {
      form.value = {
        name: '',
        status: 'active',
        configuration: 'single_version'
      }
    }
  }

  const close = () => {
    visible.value = false
    form.value = {
      name: '',
      status: 'active',
      configuration: 'single_version'
    }
  }

  const handleSave = async () => {
    if (!form.value.name.trim()) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Name is required'
      })
      return
    }

    loading.value = true
    try {
      if (props.isEditing && props.environment) {
        await updateEnvironmentService(props.environment.id, form.value)
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Environment updated successfully'
        })
      } else {
        await createEnvironmentService(form.value)
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Environment created successfully'
        })
      }
      emit('save')
      close()
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Failed to save environment'
      })
    } finally {
      loading.value = false
    }
  }

  defineExpose({ open, close })
</script>

<template>
  <Teleport to="body">
    <Sidebar
      v-model:visible="visible"
      position="right"
      :pt="{
        root: { class: 'w-full md:w-[30rem]' },
        content: { class: 'p-0' }
      }"
    >
      <template #header>
        <h2>{{ isEditing ? 'Edit Environment' : 'Create Environment' }}</h2>
      </template>

      <div class="flex flex-col gap-4 p-4">
        <div class="flex flex-col gap-2">
          <label
            for="name"
            class="text-sm font-medium"
          >
            Name
          </label>
          <InputText
            id="name"
            v-model="form.name"
            placeholder="Enter environment name"
            data-testid="environment-drawer__name-input"
          />
        </div>

        <div class="flex flex-col gap-2">
          <label
            for="status"
            class="text-sm font-medium"
          >
            Status
          </label>
          <Dropdown
            id="status"
            v-model="form.status"
            :options="statusOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Select status"
            data-testid="environment-drawer__status-dropdown"
          />
        </div>

        <div class="flex flex-col gap-2">
          <label
            for="configuration"
            class="text-sm font-medium"
          >
            Configuration
          </label>
          <Dropdown
            id="configuration"
            v-model="form.configuration"
            :options="configurationOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Select configuration"
            data-testid="environment-drawer__configuration-dropdown"
          />
        </div>
      </div>

      <div class="flex justify-end gap-2 p-4 border-t surface-border">
        <PrimeButton
          label="Cancel"
          severity="secondary"
          outlined
          @click="close"
          data-testid="environment-drawer__cancel-button"
        />
        <PrimeButton
          label="Save"
          :loading="loading"
          @click="handleSave"
          data-testid="environment-drawer__save-button"
        />
      </div>
    </Sidebar>
  </Teleport>
</template>
