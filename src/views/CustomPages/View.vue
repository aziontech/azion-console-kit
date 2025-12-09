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
  import { useRoute } from 'vue-router'
  import CreateFormBlock from '@/templates/create-form-block'
  import EditFormBlock from '@/templates/edit-form-block'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import ActionBarBlockWithTeleport from '@templates/action-bar-block/action-bar-with-teleport'
  import FormFieldsCustomPages from '@/views/CustomPages/FormFields/CustomPages'
  import { customPageService } from '@/services/v2/custom-page/custom-page-service'
  import { validationSchema, defaultValues } from '@/views/CustomPages/Config/validationSchema'
  import { useBreadcrumbs } from '@/stores/breadcrumbs'

  const initialValues = ref(defaultValues)
  const route = useRoute()
  const breadcrumbs = useBreadcrumbs()

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

  const labelTitleEdit = ref('Edit Custom Page')

  const title = computed(() => (props.mode === 'create' ? 'Create Custom Page' : labelTitleEdit))

  const loadService = async (id) => {
    const payload = await customPageService.loadCustomPagesService(id)
    labelTitleEdit.value = payload.name

    if (props.mode === 'edit') {
      breadcrumbs.update(route.meta.breadCrumbs ?? [], route, payload.name)
    }

    return payload
  }

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
          loadService: loadService,
          schema: validationSchema,
          title: labelTitleEdit,
          updatedRedirect: props.updatedRedirect
        }
      }
    }[props.mode]
  })
</script>
