<script setup>
  import { computed, ref, watch, inject } from 'vue'
  import PrimeDialog from 'primevue/dialog'
  import PrimeButton from 'primevue/button'
  import { onBeforeRouteLeave, useRouter } from 'vue-router'

  defineOptions({ name: 'dialog-unsaved-block' })
  const emit = defineEmits(['update:visible'])

  const props = defineProps({
    visible: {
      type: Boolean,
      default: false
    },
    blockRedirectUnsaved: {
      type: Boolean
    },
    isTabs: {
      type: Boolean,
      default: false
    },
    isDrawer: {
      type: Boolean,
      default: false
    }
  })

  const router = useRouter()
  const currentRouter = router.currentRoute.value.name
  const showDialog = ref(props.visible)
  const redirectToUnsaved = ref(currentRouter)
  const unsavedDisabled = ref(false)

  let changeTab, tabHasUpdate, formHasUpdated, visibleOnSaved

  if (props.isTabs) {
    const unsavedStatus = inject('unsaved')

    changeTab = unsavedStatus.changeTab
    tabHasUpdate = unsavedStatus.tabHasUpdate
    formHasUpdated = unsavedStatus.formHasUpdated
    visibleOnSaved = unsavedStatus.visibleOnSaved
  }

  let changeVisisbleDrawer, formDrawerHasUpdated

  if (props.isDrawer) {
    const unsavedStatus = inject('drawerUnsaved')

    changeVisisbleDrawer = unsavedStatus.changeVisisbleDrawer
    formDrawerHasUpdated = unsavedStatus.formDrawerHasUpdated
  }

  const visibleDialog = computed({
    get: () => showDialog.value,
    set: (value) => {
      showDialog.value = value
      emit('update:visible', value)
    }
  })

  const openDialogUnsaved = (value) => {
    visibleDialog.value = value
  }

  const onLeavePage = () => {
    if (props.isTabs && redirectToUnsaved.value === currentRouter) {
      visibleOnSaved.value = true
      changeTab(tabHasUpdate.nextTab)
      openDialogUnsaved(false)
    } else if (props.isDrawer) {
      const toKeepDisplayingDrawer = false
      const resetForm = true
      changeVisisbleDrawer(toKeepDisplayingDrawer, resetForm)
      openDialogUnsaved(false)
    } else {
      unsavedDisabled.value = true
      openDialogUnsaved(false)
      if (!redirectToUnsaved.value) {
        router.go(-1)
        return
      }

      router.push({ name: redirectToUnsaved.value })
    }
  }

  const onKeepEditing = () => {
    openDialogUnsaved(false)
    if (props.isTabs) visibleOnSaved.value = false
  }

  onBeforeRouteLeave((to, from, next) => {
    redirectToUnsaved.value = to.name
    if (props.blockRedirectUnsaved && !unsavedDisabled.value) {
      visibleDialog.value = true
      return next(false)
    }
    return next()
  })

  watch(
    tabHasUpdate,
    () => {
      if (formHasUpdated.value) {
        visibleOnSaved.value = true
        openDialogUnsaved(true)
        changeTab(tabHasUpdate.oldTab)
      }
    },
    { deep: true }
  )

  watch(formDrawerHasUpdated, () => {
    openDialogUnsaved(true)
  })
</script>

<template>
  <div>
    <PrimeDialog
      :blockScroll="true"
      v-model:visible="visibleDialog"
      @update:visible="openDialogUnsaved"
      modal
      class="w-full max-w-xl"
      :closable="false"
    >
      <template #header>
        <h5 class="text-lg not-italic font-bold leading-5">Unsaved changes</h5>
      </template>
      <div class="text-color-secondary text-sm font-normal leading-5">
        Your changes will be discarded if you leave the page without saving them. Do you want to
        leave?
      </div>
      <template #footer>
        <PrimeButton
          severity="primary"
          label="Leave page"
          outlined
          @click="onLeavePage"
        />
        <PrimeButton
          severity="secondary"
          label="Keep editing"
          @click="onKeepEditing"
        />
      </template>
    </PrimeDialog>
  </div>
</template>
