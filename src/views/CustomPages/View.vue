<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock :pageTitle="title" />
    </template>
    <template #content>
      <component
        :is="componentForm.component"
        v-bind="componentForm.props"
        @on-response="handleToast"
      >
        <template #form>
          <FormFieldsCustomPages />
        </template>
        <template #action-bar="{ onSubmit, onCancel, loading }">
          <ActionBarBlockWithTeleport
            @onSubmit="onSubmit"
            @onCancel="onCancel"
            :loading="loading"
          />
        </template>
      </component>
    </template>
  </ContentBlock>
</template>

<script setup>
  import { ref, computed } from 'vue'
  import CreateFormBlock from '@/templates/create-form-block'
  import EditFormBlock from '@/templates/edit-form-block'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import ActionBarBlockWithTeleport from '@templates/action-bar-block/action-bar-with-teleport'
  import FormFieldsCustomPages from './FormFields/FormFieldsCustomPages'
  import { customPageService } from '@/services/v2'
  import { validationSchema, defaultValues } from './Config/validation'

  const initialValues = ref(defaultValues)

  defineOptions({
    name: 'custom-pages-view'
  })

  const handleToast = (response) => {
    const toast = {
      feedback: 'Custom Page successfully created',
      actions: {
        link: {
          label: 'View Custom Page',
          callback: () => response.redirectToUrl(`/custom-pages/edit/${response.data.id}`)
        }
      }
    }
    response.showToastWithActions(toast)
  }

  const props = defineProps({
    mode: {
      type: String,
      default: 'create'
    },
    updatedRedirect: {
      type: String,
      default: 'list-custom-pages'
    }
  })

  const title = computed(() => {
    return props.mode === 'create' ? 'Create Custom Page' : 'Edit Custom Page'
  })

  const componentForm = computed(() => {
    return {
      create: {
        component: CreateFormBlock,
        props: {
          createService: customPageService.createCustomPagesService,
          schema: validationSchema,
          initialValues: initialValues,
          disableToast: true
        }
      },
      edit: {
        component: EditFormBlock,
        props: {
          editService: customPageService.editCustomPagesService,
          loadService: customPageService.loadCustomPagesService,
          schema: validationSchema,
          updatedRedirect: props.updatedRedirect
        }
      }
    }[props.mode]
  })
</script>
