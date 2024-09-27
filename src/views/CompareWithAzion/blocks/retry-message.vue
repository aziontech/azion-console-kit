<template>
  <Message
    :severity="props.data.severity"
    :closable="false"
  >
    <div class="flex gap-2 items-center">
      {{ props.data.message }}

      <div
        v-if="props.data?.retry"
        class="flex items-center"
      >
        (&nbsp;&nbsp;
        <strong
          v-if="props.data?.retry && counter"
          class="flex items-center"
        >
          {{ counter }} seconds
        </strong>
        <span
          v-else
          class="ml-2"
        >
          <i class="pi pi-spin pi-spinner"></i>
        </span>

        <Button
          link
          :label="retryButton.label"
          :disabled="retryButton.disabled"
          @click="timerZero"
        />
        )
      </div>
    </div>
  </Message>
</template>

<script setup>
  import {  onMounted, ref } from 'vue'
  import Message from 'primevue/message'
  import Button from 'primevue/button'
  
  const emit = defineEmits(['onRetry'])
  const props = defineProps({
    data: ref({
      type: Object,
      required: true
    }),
    timer: {
      type: Number,
      default: 30
    },
    severity: {
      type: String,
      default: 'error'
    }
  })
  
  const counter = ref(props.timer)
  const retryButton = ref({
    disabled: false,
    label: 'retry'
  })
  const RECONSULTATION_TIME_MS = 1000

  const timerZero = () => {
    emit('onRetry')

    setCounter(0)
    clearInterval(interval)

    retryButton.value = {
      disabled: true,
      label: 'retrying'
    }
  }

  const setCounter = (number) => {
    return (counter.value = number)
  }

  let interval
  const startCounter = () => {
    interval = setInterval(() => {
      const decreasedCounter = counter.value - 1
      setCounter(decreasedCounter)

      if (!decreasedCounter) timerZero()
    }, RECONSULTATION_TIME_MS)
  }

  onMounted(() => {
    if (!props.data.retry) return

    setCounter(props.timer)
    startCounter()
  })
</script>
