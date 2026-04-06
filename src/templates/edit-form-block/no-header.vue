<script setup>
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport.vue'
  import DialogUnsaved from '@/templates/dialog-unsaved/DialogUnsaved.vue'
  import { capitalizeFirstLetter } from '@/helpers'
  import { ref, computed, onMounted } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useToast } from '@aziontech/webkit/use-toast'
  import { useUnsavedChanges } from '@/composables/useUnsavedChanges'

  defineOptions({ name: 'edit-form-block-no-header' })

  const props = defineProps({
    editService: {
      type: Function,
      required: true
    },
    loadService: {
      type: Function,
      required: true
    },
    initialDataSetter: {
      type: Function,
      required: true
    },
    formData: {
      type: Object,
      required: true
    },
    formMeta: {
      type: Object,
      required: true
    },
    updatedRedirect: {
      type: String,
      required: true
    }
  })

  const route = useRoute()
  const router = useRouter()
  const toast = useToast()

  const isLoading = ref(false)
  const teleportLoad = ref(false)
  const isFormReady = ref(false)

  const isTouched = computed(() => props.formMeta.touched)

  const unsaved = useUnsavedChanges({
    isReady: isFormReady,
    enableRouteGuard: true,
    enableBeforeUnload: true
  })

  unsaved.addDirtySource(isTouched)

  const showToast = (severity, detail) => {
    if (!detail) return

    const options = {
      closable: true,
      severity,
      summary: capitalizeFirstLetter(severity),
      detail
    }

    toast.add(options)
  }

  const goBackToList = () => {
    if (props.updatedRedirect) {
      router.push({ name: props.updatedRedirect })
      return
    }
    router.go(-1)
  }

  const handleCancel = () => {
    goBackToList()
  }

  const loadInitialData = async () => {
    try {
      const { id } = route.params
      isLoading.value = true
      const initialData = await props.loadService({ id })
      props.initialDataSetter(initialData)
    } catch (error) {
      showToast('error', error)
    } finally {
      isLoading.value = false
      isFormReady.value = true
    }
  }

  const handleSubmit = async () => {
    try {
      isLoading.value = true
      await props.editService(props.formData)
      showToast('success', 'edited successfully')
      unsaved.disable()
      goBackToList()
    } catch (error) {
      showToast('error', error)
    } finally {
      setTimeout(() => {
        isLoading.value = false
      }, 800)
    }
  }

  loadInitialData()

  onMounted(() => {
    teleportLoad.value = true
  })
</script>

<template>
  <div class="flex flex-col min-h-[calc(100vh-120px)]">
    <form
      @submit.prevent="handleSubmit"
      class="w-full grow flex flex-col gap-8 mt-4"
    >
      <slot name="form" />

      <slot name="raw-form" />
    </form>
    <DialogUnsaved
      :visible="unsaved.isDialogVisible.value"
      @leave="unsaved.confirmLeave"
      @stay="unsaved.cancelLeave"
    />
  </div>
  <Teleport
    to="#action-bar"
    v-if="teleportLoad"
  >
    <ActionBarTemplate
      @cancel="handleCancel"
      @submit="handleSubmit"
      :loading="isLoading"
      :submitDisabled="!formMeta.valid"
    />
  </Teleport>
</template>
