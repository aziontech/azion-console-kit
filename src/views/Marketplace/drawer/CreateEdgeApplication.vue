<script setup>
  import { ref } from 'vue'
  import Sidebar from 'primevue/sidebar'
  import ProgressBar from 'primevue/progressbar'
  import * as yup from 'yup'
  import FormFieldsCreateEdgeApplications from '@/views/EdgeApplications/FormFields/FormFieldsCreateEdgeApplications'
  import CreateFormBlock from '@/templates/create-form-block'
  import ActionBarBlockWithTeleport from '@templates/action-bar-block/action-bar-with-teleport'

  const emit = defineEmits(['update:visible'])

  const props = defineProps({
    visible: {
      type: Boolean,
      default: false
    },
    position: {
      type: String,
      default: 'right'
    },
    createEdgeApplicationService: {
      type: Function,
      required: true
    }
  })

  const loading = ref(false)

  const validationSchema = yup.object({
    name: yup.string().required(),
    address: yup.string().required(),
    hostHeader: yup.string().required(),
    cdnCacheSettingsMaximumTtl: yup.string().required()
  })

  const initialValues = ref({
    name: '',
    deliveryProtocol: 'http',
    httpPort: { label: '80 (Default)', value: '80' },
    httpsPort: { label: '443 (Default)', value: '443' },
    minimumTlsVersion: { label: 'None', value: '' },
    supportedVersion: { label: 'All', value: 'all' },
    originType: { label: 'Single Origin', value: 'single_origin' },

    address: '',
    originProtocolPolicy: 'preserve',
    hostHeader: '${host}',
    browserCacheSettings: 'honor',
    browserCacheSettingsMaximumTtl: '',
    cdnCacheSettings: 'honor',
    cdnCacheSettingsMaximumTtl: 60
  })

  const handleSuccess = () => {
    toggleSidebar(false)
    loading.value = false
  }

  const handleCancel = () => {
    toggleSidebar(false)
  }

  const handleSubmit = (onSubmit) => {
    onSubmit()
    loading.value = true
  }

  const toggleSidebar = (value) => {
    emit('update:visible', value)
  }
</script>

<template>
  <Sidebar
    :visible="props.visible"
    @update:visible="toggleSidebar"
    :position="props.position"
    :pt="{
      root: { class: 'max-w-4xl w-full p-0' },
      content: { class: '[&::-webkit-scrollbar]:hidden p-0 flex flex-col justify-between' }
    }"
  >
    <template #header>
      <div>Create Edge Application</div>
    </template>
    <template #default>
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
      <div class="flex flex-col w-full md:p-8 pb-0">
        <CreateFormBlock
          :createService="props.createEdgeApplicationService"
          :schema="validationSchema"
          :initialValues="initialValues"
          :disabledCallback="true"
          @onResponse="handleSuccess"
        >
          <template #form>
            <FormFieldsCreateEdgeApplications />
          </template>

          <template #action-bar="{ onSubmit, formValid, loading }">
            <ActionBarBlockWithTeleport
              id="#action-bar-create"
              @onSubmit="() => handleSubmit(onSubmit)"
              @onCancel="handleCancel"
              :loading="loading"
              :submitDisabled="!formValid"
            />
          </template>
        </CreateFormBlock>
        <div
          id="action-bar-create"
          class="sticky bottom-0 z-20"
        ></div>
      </div>
    </template>
  </Sidebar>
</template>
