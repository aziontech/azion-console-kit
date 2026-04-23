<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldSwitchBlock from '@aziontech/webkit/field-switch-block'
  import FieldText from '@aziontech/webkit/field-text'
  import Skeleton from '@aziontech/webkit/skeleton'
  import { computed } from 'vue'
  import { useThemeStore } from '@/stores/theme'
  import { useField } from 'vee-validate'
  defineOptions({ name: 'form-fields-edge-service' })

  defineProps({
    isDrawer: {
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    }
  })

  const { value: name } = useField('name')
  const { value: code, errorMessage: codeError } = useField('code')

  const editorOptions = {
    minimap: { enabled: false },
    tabSize: 2,
    formatOnPaste: true
  }

  const store = useThemeStore()
  const theme = computed(() => {
    return store.currentTheme === 'light' ? 'vs' : 'vs-dark'
  })
</script>

<template>
  <FormHorizontal
    title="General"
    description="Services define dependencies between resources."
    :isDrawer="isDrawer"
  >
    <template #inputs>
      <FieldText
        label="Name"
        required
        name="name"
        placeholder="My service"
        :value="name"
        description="Give a unique and descriptive name to identify the service."
        data-testid="edge-service-form__name-field"
      />
    </template>
  </FormHorizontal>

  <FormHorizontal
    title="Variables"
    description="Variables are dynamic values that affect the edge services that will be orchestrated and run on Edge Nodes."
    :isDrawer="isDrawer"
  >
    <template #inputs>
      <div class="flex flex-col h-full gap-2">
        <Skeleton
          v-if="loading"
          height="200px"
          width="100%"
          borderRadius="6px"
        />
        <template v-else>
          <vue-monaco-editor
            v-model:value="code"
            language="shell"
            name="code"
            :theme="theme"
            class="min-h-[200px] overflow-clip surface-border border rounded-md"
            :class="{ 'border-red-500 border': codeError }"
            :options="editorOptions"
            data-testid="edge-service-form__variables-field"
          />
          <small
            v-if="codeError"
            class="p-error text-xs font-normal leading-tight"
          >
            {{ codeError }}
          </small>
          <small class="text-xs text-color-secondary font-normal leading-5">
            Enter the list of variables and values for the resource. Example:
            <code>port=3306</code>.
          </small>
        </template>
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    title="Status"
    :isDrawer="isDrawer"
  >
    <template #inputs>
      <FieldSwitchBlock
        nameField="active"
        name="active"
        auto
        :isCard="false"
        title="Active"
        data-testid="edge-service-form__status__active-field"
      />
    </template>
  </FormHorizontal>
</template>
