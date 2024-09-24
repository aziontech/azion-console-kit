<script setup>
  import { ref, watch } from 'vue'
  import PrimeDialog from 'primevue/dialog'
  import PrimeButton from 'primevue/button'
  import TextArea from 'primevue/textarea'

  defineOptions({ name: 'dialog-allow-rule' })

  const emit = defineEmits(['update:visible', 'closeDialog'])
  const reason = ref('')

  const props = defineProps({
    visible: {
      type: Boolean,
      default: false
    },
    isLoading: {
      type: Boolean,
      default: false
    }
  })

  const showDialog = ref(false)
  const loading = ref(false)

  const closeDialog = () => {
    emit('closeDialog')
  }

  const handleAllowRule = () => {
    if (!reason.value) return
    emit('reason', reason.value)
    loading.value = true
  }

  watch(
    () => props.visible,
    (value) => {
      showDialog.value = value
    }
  )

  watch(
    () => props.isLoading,
    (value) => {
      if (value === false) {
        reason.value = ''
      }
      loading.value = value
    }
  )
</script>

<template>
  <div>
    <PrimeDialog
      :blockScroll="true"
      v-model:visible="showDialog"
      modal
      @hide="closeDialog"
      :pt="{
        root: { class: 'p-0 w-[37.5rem]' },
        header: { class: 'flex py-5 px-8 items-center self-stretch border-b border-solid' },
        content: { class: 'p-0 h-full' },
        footer: {
          class: 'flex py-5 px-8 justify-end items-end border-t border-solid'
        }
      }"
    >
      <template #header>
        <h5 class="text-lg not-italic font-bold leading-5">
          Allow all rules from a list of possible attacks
        </h5>
      </template>
      <div class="py-5 px-8 flex justify-center flex-col">
        <div class="text-secondary-color text-sm mb-3.5">
          For each URI, this action will create a separate rule for each possible attack.
        </div>
        <div class="text-color font-semibold text-sm mb-2">
          To confirm, enter the reason for allowing these rules or provide additional information in
          the box below:
        </div>
        <TextArea
          required
          v-model="reason"
          type="text"
          rows="5"
          cols="60"
        />
      </div>
      <template #footer>
        <PrimeButton
          severity="primary"
          label="Cancel"
          outlined
          @click="closeDialog"
        />
        <PrimeButton
          severity="secondary"
          label="Allow Rules"
          :loading="loading"
          :disabled="!reason"
          @click="handleAllowRule"
          iconPos="right"
        />
      </template>
    </PrimeDialog>
  </div>
</template>
