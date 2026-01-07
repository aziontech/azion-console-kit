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

  const unsavedStatus = props.isTabs ? inject('unsaved') : null
  const drawerUnsavedStatus = props.isDrawer ? inject('drawerUnsaved') : null

  const changeTab = unsavedStatus?.changeTab
  const tabHasUpdate = unsavedStatus?.tabHasUpdate
  const visibleOnSaved = unsavedStatus?.visibleOnSaved

  const changeVisibleDrawer = drawerUnsavedStatus?.changeVisibleDrawer
  const formDrawerHasUpdated = drawerUnsavedStatus?.formDrawerHasUpdated

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
      changeVisibleDrawer(toKeepDisplayingDrawer, resetForm)
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

  if (unsavedStatus) {
    watch(
      () => unsavedStatus.tabHasUpdate.updated,
      () => {
        if (unsavedStatus.formHasUpdated.value) {
          unsavedStatus.visibleOnSaved.value = true
          openDialogUnsaved(true)
          unsavedStatus.changeTab(unsavedStatus.tabHasUpdate.oldTab)
        }
      },
      { flush: 'sync' }
    )
  }

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
        <h5 class="text-lg not-italic font-medium leading-5">Unsaved changes</h5>
      </template>
      <div class="text-color-secondary text-sm font-normal leading-5">
        Your changes will be discarded if you leave the page without saving them. Do you want to
        leave?
      </div>
      <template #footer>
        <PrimeButton
          severity="primary"
          size="small"
          label="Leave page"
          data-testid="dialog-unsaved__leave-page"
          outlined
          @click="onLeavePage"
        />
        <PrimeButton
          severity="secondary"
          size="small"
          label="Keep editing"
          @click="onKeepEditing"
        />
      </template>
    </PrimeDialog>
  </div>
</template>
