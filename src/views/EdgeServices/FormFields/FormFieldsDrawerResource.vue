<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldDropdown from '@/templates/form-fields-inputs/fieldDropdown.vue'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import { ref, computed } from 'vue'
  import { useAccountStore } from '@/stores/account'
  import FieldGroupRadio from '@/templates/form-fields-inputs/fieldGroupRadio'
  import LabelBlock from '@/templates/label-block'
  import { useField } from 'vee-validate'
  defineOptions({ name: 'form-fields-drawer-resource' })

  const props = defineProps({
    disabledFields: {
      type: Boolean,
      default: false
    }
  })

  const store = useAccountStore()
  const contentTypeShellScript = 'Shell Script'

  const editorOptions = computed(() => {
    return {
      minimap: { enabled: false },
      tabSize: 2,
      formatOnPaste: true,
      readOnly: props.disabledFields
    }
  })
  const { value: name } = useField('name')
  const { value: contentType } = useField('contentType')
  const { value: content, errorMessage: contentError } = useField('content')

  const theme = computed(() => {
    return store.currentTheme === 'light' ? 'vs' : 'vs-dark'
  })

  const isShellScript = computed(() => {
    return contentType.value === contentTypeShellScript
  })

  const typeRadioOptions = [
    {
      title: 'Shell Script',
      value: 'Shell Script'
    },
    {
      title: 'Text',
      value: 'Text'
    }
  ]

  const triggerRadioOptions = [
    {
      title: 'Install',
      inputValue: 'Install'
    },
    {
      title: 'Reload',
      inputValue: 'Reload'
    },
    {
      title: 'Uninstall',
      inputValue: 'Uninstall'
    }
  ]

  const isFieldDisabled = ref(false)
  isFieldDisabled.value = props.disabledFields
</script>

<template>
  <FormHorizontal
    :isDrawer="true"
    title="Resource"
    description="Configure the resources needed to install, uninstall, and reload your services."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Path"
          required
          name="name"
          placeholder="/tmp/myresource"
          :disabled="isFieldDisabled"
          :value="name"
          description="The path where the resource will be saved on the edge node."
          data-testid="edge-service-drawer-form__path-field"
        />
      </div>
      <div class="flex flex-col sm:w-2/5 gap-2">
        <FieldDropdown
          label="Type"
          :options="typeRadioOptions"
          optionLabel="title"
          optionValue="value"
          inputClass="w-full"
          name="contentType"
          :value="contentType"
          data-testid="edge-service-drawer-form__type-field"
        />
      </div>
      <div v-show="isShellScript">
        <FieldGroupRadio
          label="Trigger Type"
          helpText="Define the trigger for when the script is executed."
          nameField="trigger"
          :isCard="false"
          :options="triggerRadioOptions"
          data-testid="edge-service-drawer-form__type-field"
        />
      </div>
      <div class="flex flex-col w-full sm:max-w-3xl gap-2">
        <div class="flex flex-col gap-2">
          <div class="flex flex-col w-full gap-2">
            <LabelBlock
              label="Content"
              isRequired
            />
            <div class="flex flex-col h-full gap-2">
              <vue-monaco-editor
                v-model:value="content"
                name="content"
                language="shell"
                :theme="theme"
                class="min-h-[200px] overflow-clip surface-border border rounded-md"
                :class="{ 'border-red-500 border': contentError }"
                :options="editorOptions"
                data-testid="edge-service-drawer-form__content-field"
              />
              <small
                v-if="contentError"
                class="p-error text-xs font-normal leading-tight"
              >
                {{ contentError }}
              </small>
              <small class="text-xs text-color-secondary font-normal leading-5">
                The content of the resource. You can add variables to the resource content by
                referencing the tag
                <code>&#123;&#123; VARNAME &#125;&#125;</code>.<br />
                <strong>Shell Script</strong> resources must carry a shebang in the content header.
                In the absence of one, the POSIX-compliant shell on the device
                (<code>/bin/sh</code>) will be used.
              </small>
            </div>
          </div>
        </div>
      </div>
    </template>
  </FormHorizontal>
</template>
