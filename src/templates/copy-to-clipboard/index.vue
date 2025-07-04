<template>
  <Button
    :icon="icon"
    :severity="severity"
    :size="size"
    :disabled="disabled"
    :loading="loading"
    :class="buttonClass"
    @click="handleCopy"
    :aria-label="ariaLabel"
  />
</template>

<script setup>
  import { ref } from 'vue'
  import { useToast } from 'primevue/usetoast'
  import Button from 'primevue/button'
  import { clipboardWrite } from '@/helpers/clipboard'

  defineOptions({
    name: 'CopyToClipboard'
  })

  const props = defineProps({
    /**
     * Conteúdo a ser copiado para a área de transferência
     */
    content: {
      type: String,
      required: true
    },
    /**
     * Ícone do botão (padrão: pi-copy)
     */
    icon: {
      type: String,
      default: 'pi pi-copy'
    },
    /**
     * Severidade do botão (primary, secondary, success, info, warning, help, danger)
     */
    severity: {
      type: String,
      default: 'primary',
      validator: (value) =>
        ['primary', 'secondary', 'success', 'info', 'warning', 'help', 'danger'].includes(value)
    },
    /**
     * Tamanho do botão (small, normal, large)
     */
    size: {
      type: String,
      default: 'normal',
      validator: (value) => ['small', 'normal', 'large'].includes(value)
    },
    /**
     * Se o botão está desabilitado
     */
    disabled: {
      type: Boolean,
      default: false
    },
    /**
     * Se o botão está em estado de loading
     */
    loading: {
      type: Boolean,
      default: false
    },
    /**
     * Classes CSS adicionais para o botão
     */
    buttonClass: {
      type: String,
      default: ''
    },
    /**
     * Texto do aria-label para acessibilidade
     */
    ariaLabel: {
      type: String,
      default: 'Copiar para área de transferência'
    },
    /**
     * Mensagem de sucesso personalizada
     */
    successMessage: {
      type: String,
      default: 'Copiado com sucesso!'
    },
    /**
     * Mensagem de erro personalizada
     */
    errorMessage: {
      type: String,
      default: 'Erro ao copiar para área de transferência'
    }
  })

  const emit = defineEmits(['copy-success', 'copy-error'])

  const toast = useToast()
  const isCopying = ref(false)

  const handleCopy = async () => {
    if (isCopying.value || props.disabled || props.loading) {
      return
    }

    isCopying.value = true

    try {
      await clipboardWrite(props.content)

      toast.add({
        severity: 'success',
        summary: 'Sucesso',
        detail: props.successMessage,
        life: 3000
      })

      emit('copy-success', props.content)
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Erro',
        detail: props.errorMessage,
        life: 5000
      })

      emit('copy-error', error)
    } finally {
      isCopying.value = false
    }
  }
</script>

<style scoped>
  /* Estilos adicionais se necessário */
  .p-button.p-button-icon-only {
    min-width: 2.5rem;
    height: 2.5rem;
  }

  .p-button.p-button-icon-only.p-button-sm {
    min-width: 2rem;
    height: 2rem;
  }

  .p-button.p-button-icon-only.p-button-lg {
    min-width: 3rem;
    height: 3rem;
  }
</style>
