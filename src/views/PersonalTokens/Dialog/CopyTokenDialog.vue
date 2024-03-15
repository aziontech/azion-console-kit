<template>
  <div>
    <PrimeDialog
      :blockScroll="true"
      v-model:visible="visibleDialog"
      @update:visible="toggleAttentionDialog"
      modal
      :closable="false"
      :pt="{
        root: { class: 'p-0 w-[576px]' },
        header: {
          class: 'flex pt-5 pb-5 items-center self-stretch border-b border-solid'
        },
        content: { class: 'p-0 h-full' },
        footer: {
          class: 'flex p-5 justify-end items-end border-t border-solid'
        }
      }"
    >
      <template #header>
        <h5 class="text-lg not-italic font-semibold leading-5">Attention</h5>
      </template>

      <div class="flex p-5 flex-col gap-3.5">
        <div>
          <InlineMessage severity="error">
            If you close this dialog, you'll no longer be able to access your personal token.
          </InlineMessage>
        </div>

        <div class="flex flex-col w-full gap-2">
          <label
            for="personalToken"
            class="text-color text-base font-medium"
          >
            Personal Token
          </label>

          <span class="p-input-icon-right w-full flex flex-col items-start gap-2">
            <PrimePassword
              id="personalToken"
              v-model="personalTokenValue"
              type="text"
              class="flex flex-col w-full"
              :pt="{
                input: { class: 'opacity-100' }
              }"
              :feedback="false"
              toggleMask
              disabled
            />

            <small class="text-xs text-color-secondary font-normal leading-5">
              Copy the personal token now. The token won't be retrievable once this dialog is
              closed.
            </small>
          </span>
        </div>
        <div>
          <PrimeButton
            icon="pi pi-clone"
            outlined
            type="button"
            aria-label="Copy Personal Token"
            label="Copy"
            :disabled="!personalTokenValue"
            @click="props.copy"
          />
        </div>
      </div>

      <template #footer>
        <PrimeButton
          severity="secondary"
          label="Confirm"
          @click="iAgreeSubmit"
        />
      </template>
    </PrimeDialog>
  </div>
</template>

<script setup>
  import { computed, ref } from 'vue'
  import PrimeDialog from 'primevue/dialog'
  import InlineMessage from 'primevue/inlinemessage'
  import PrimePassword from 'primevue/password'
  import PrimeButton from 'primevue/button'
  import { onBeforeRouteLeave, useRouter } from 'vue-router'

  defineOptions({ name: 'CopyTokenDialog' })

  const props = defineProps({
    visible: {
      type: Boolean,
      default: false
    },
    personalToken: {
      type: String,
      required: true
    },
    tokenAlreadySaved: {
      type: Boolean,
      default: true
    },
    copy: {
      type: Function
    }
  })

  const emit = defineEmits(['update:visible'])
  const userAgreed = ref(false)

  const visibleDialog = computed({
    get: () => props.visible,
    set: (value) => {
      emit('update:visible', value)
    }
  })

  const personalTokenValue = computed({
    get: () => props.personalToken
  })

  const router = useRouter()

  const toggleAttentionDialog = (value) => {
    visibleDialog.value = value
  }

  const iAgreeSubmit = () => {
    toggleAttentionDialog(false)
    userAgreed.value = true
    router.go(-1)
  }

  onBeforeRouteLeave((to, from, next) => {
    if (props.tokenAlreadySaved && !userAgreed.value) {
      toggleAttentionDialog(true)
      return next(false)
    }
    return next()
  })
</script>
