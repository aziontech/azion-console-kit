<script setup>
  import { ref, computed } from 'vue'

  // Import the components
  import FormFieldsDataStream from './FormFields/FormFieldsDataStream'
  import SamplingDialog from './Dialog/SamplingDialog'
  import EditFormBlock from '@/templates/edit-form-block'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import ActionBarBlockWithTeleport from '@/templates/action-bar-block/action-bar-with-teleport'
  import { useAccountStore } from '@/stores/account'
  import { dataStreamService } from '@/services/v2'
  import { validationSchema } from './FormFields/composables/validation'

  const props = defineProps({
    updatedRedirect: {
      type: String,
      required: true
    }
  })

  const store = useAccountStore()
  const hasNoPermissionToEditDataStream = computed(() => store.hasPermissionToEditDataStream)
  const hasAccessToSampling = computed(() => store.hasSamplingFlag)

  const displaySamplingDialog = ref(false)
  const formSubmit = (onSubmit) => {
    if (!hasAccessToSampling.value) {
      onSubmit()
    } else {
      displaySamplingDialog.value = true
    }
  }
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Edit Stream" />
    </template>
    <template #content>
      <EditFormBlock
        :editService="dataStreamService.editDataStreamService"
        :loadService="dataStreamService.loadDataStreamService"
        :updatedRedirect="props.updatedRedirect"
        :schema="validationSchema"
      >
        <template #form>
          <FormFieldsDataStream />
        </template>
        <template
          v-if="hasNoPermissionToEditDataStream"
          #action-bar="{ onSubmit, onCancel, loading, values }"
        >
          <ActionBarBlockWithTeleport
            @onSubmit="formSubmit(onSubmit, values)"
            @onCancel="onCancel"
            :loading="loading"
          />
          <SamplingDialog
            data-testid="data-stream-form__sampling__dialog"
            v-model:visible="displaySamplingDialog"
            @confirm="onSubmit"
            @cancel="displaySamplingDialog = false"
          />
        </template>
      </EditFormBlock>
    </template>
  </ContentBlock>
</template>
