<script setup>
  import { computed, ref } from 'vue'
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
    }
  })

  const router = useRouter()
  const showDialog = ref(props.visible)
  const redirectToUnsaved = ref('home')
  const unsavedDisabled = ref(false)

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
    unsavedDisabled.value = true
    openDialogUnsaved(false)
    if (!redirectToUnsaved.value) {
      router.go(-1)
      return
    }

    router.push({ name: redirectToUnsaved.value })
  }

  const onKeepEditing = () => {
    openDialogUnsaved(false)
  }

  onBeforeRouteLeave((to, from, next) => {
    redirectToUnsaved.value = to.name
    if (props.blockRedirectUnsaved && !unsavedDisabled.value) {
      visibleDialog.value = true
      return next(false)
    }
    return next()
  })
</script>

<template>
  <div>
    <PrimeDialog
      :blockScroll="true"
      v-model:visible="visibleDialog"
      @update:visible="openDialogUnsaved"
      modal
      :closable="false"
      :pt="{
        root: { class: 'p-0 w-[576px]' },
        header: { class: 'flex p-5 items-center self-stretch border-b border-solid' },
        content: { class: 'p-0 h-full' },
        footer: {
          class: 'flex p-5 justify-end items-end border-t border-solid'
        }
      }"
    >
      <template #header>
        <h5 class="text-lg not-italic font-bold leading-5">Unsaved changes</h5>
      </template>
      <div class="flex p-5 items-center flex-1 text-secondary-color text-sm font-normal leading-5">
        There are unsaved changes. Do you want to leave without finishing?
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
