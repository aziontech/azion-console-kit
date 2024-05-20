<script setup>
  import { onMounted, ref } from 'vue'
  defineOptions({ name: 'action-bar-block' })
  import ActionBarTemplate from '@/templates/action-bar-block'

  const emit = defineEmits(['onSubmit', 'onCancel'])

  const props = defineProps({
    id: { type: String, default: '#action-bar' },
    loading: Boolean,
    cancelDisabled: Boolean,
    submitDisabled: Boolean,
    primaryActionLabel: { type: String, default: 'Save' }
  })

  const handleSubmit = () => {
    emit('onSubmit')
  }

  const handleCancel = () => {
    emit('onCancel')
  }

  const isMounted = ref(false)

  onMounted(() => {
    isMounted.value = true
  })
</script>

<template>
  <teleport
    :to="id"
    v-if="isMounted"
  >
    <ActionBarTemplate
      :loading="props.loading"
      :cancelDisabled="props.cancelDisabled"
      :submitDisabled="props.submitDisabled"
      :inDrawer="false"
      :primaryActionLabel="props.primaryActionLabel"
      @onSubmit="handleSubmit"
      @onCancel="handleCancel"
    />
  </teleport>
</template>
