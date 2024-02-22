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
    visibleOnSaved.value = false
  }

  onBeforeRouteLeave((to, from, next) => {
    redirectToUnsaved.value = to.name
    if (props.blockRedirectUnsaved && !unsavedDisabled.value) {
      visibleDialog.value = true
      return next(false)
    }
    return next()
  })

  watch(tabHasUpdate, () => {
    if (formHasUpdated.value) {
      visibleOnSaved.value = true
      openDialogUnsaved(true)
      changeTab(tabHasUpdate.oldTab)
    }
  })
</script>

<template>
  <div>
    <PrimeDialog
      :blockScroll="true"
      v-model:visible="visibleDialog"
      @update:visible="openDialogUnsaved"
      modal
      header="Unsaved changes"
      :closable="false"
      :draggable="false"
      :pt="{
        root: { class: 'w-[576px]' },
        header: { class: 'p-3 md:p-8' },
        content: { class: 'p-3 md:px-8 md:py-5' },
        footer: { class: 'p-3 md:p-8' },
      }"
    >
      <p class="text-color-secondary">There are unsaved changes. Do you want to leave without finishing?</p>

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
