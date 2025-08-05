<template>
  <PrimeDialog
    :blockScroll="true"
    modal
    visible
    :closable="false"
    class="w-[576px]"
    header="Credential has been created"
  >
    <div class="flex flex-col gap-4">
      <div class="flex flex-col w-full gap-2">
        <label
          for="credentialName"
          class="text-color text-base font-medium"
        >
          {{ credential.name }}
        </label>
        <span class="text-xs text-color-secondary font-normal leading-5">
          Expires at {{ credential.expiresAt }}
        </span>
      </div>

      <div class="flex flex-col w-full gap-2">
        <label
          for="accessKey"
          class="text-color text-base font-medium"
        >
          Access Key
        </label>
        <div class="flex items-start gap-2">
          <span class="p-input-icon-right w-full flex flex-col items-start gap-2">
            <PrimePassword
              id="accessKey"
              v-model="credential.accessKey"
              type="text"
              class="flex flex-col w-full"
              :pt="{
                input: {
                  readonly: true
                }
              }"
              :feedback="false"
              toggleMask
            />
          </span>
          <PrimeButton
            icon="pi pi-copy"
            size="medium"
            outlined
            @click="copyKey('accessKey')"
            class="px-4 py-2"
          />
        </div>
      </div>

      <div class="flex flex-col w-full gap-2">
        <label
          for="secretKey"
          class="text-color text-base font-medium"
        >
          Secret Key
        </label>

        <div class="flex items-start gap-2">
          <span class="p-input-icon-right w-full flex flex-col items-start gap-2">
            <PrimePassword
              id="secretKey"
              v-model="credential.secretKey"
              type="text"
              class="flex flex-col w-full"
              :pt="{
                input: {
                  readonly: true
                }
              }"
              :feedback="false"
              toggleMask
            />
          </span>
          <PrimeButton
            icon="pi pi-copy"
            size="medium"
            outlined
            @click="copyKey('secretKey')"
            class="px-4 py-2"
          />
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <PrimeButton
          label="Confirm"
          size="small"
          severity="secondary"
          @click="closeDialog"
        />
      </div>
    </template>
  </PrimeDialog>
</template>

<script setup>
  import PrimeDialog from 'primevue/dialog'
  import PrimeButton from 'primevue/button'
  import PrimePassword from 'primevue/password'
  import { inject, ref } from 'vue'
  import { useToast } from 'primevue/usetoast'

  defineOptions({ name: 'credential-created-dialog' })

  const dialogRef = inject('dialogRef')
  const toast = useToast()
  const credential = ref(dialogRef.value.data.credential)

  const copyKey = async (key) => {
    try {
      await navigator.clipboard.writeText.bind(navigator.clipboard)(credential.value[key])
      toast.add({
        severity: 'success',
        summary: 'Copied!',
        detail: `${key === 'accessKey' ? 'Access Key' : 'Secret Key'} copied to clipboard`,
        life: 3000
      })
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: `Failed to copy ${key === 'accessKey' ? 'Access Key' : 'Secret Key'} to clipboard`,
        life: 3000
      })
    }
  }

  const closeDialog = () => {
    dialogRef.value.close()
  }
</script>
