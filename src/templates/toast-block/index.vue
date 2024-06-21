<template>
  <Toast :pt="toastOptions">
    <template #message="{ message }">
      <div class="flex flex-column flex-grow">
        <header class="flex gap-2 items-center h-8 w-[calc(100%-2.5em)] max-w-2xl">
          <Tag
            :icon="composeIconStyle(message.severity)"
            :severity="handleSeverity(message)"
            :pt="{ icon: { class: 'mr-0' }, root: { class: 'w-6 h-6' } }"
          />
          <h5 class="text-color text-base font-semibold truncate">
            {{ parseText(message.summary, CHAR_LIMITS.SUMMARY) }}
          </h5>
        </header>
        <p
          class="text-sm text-color-secondary font-normal mt-3"
          v-if="message.detail"
        >
          {{ parseText(message.detail, CHAR_LIMITS.DETAIL) }}
        </p>
        <div
          class="flex flex-row gap-2 align-self-end mt-5"
          v-if="showActions(message)"
        >
          <PrimeButton
            v-if="message.action.link"
            link
            size="small"
            :label="message.action.link.label"
            @click="handleClick(message, 'link')"
          />
          <PrimeButton
            v-if="message.action.secondary"
            outlined
            size="small"
            :label="message.action.secondary.label"
            @click="handleClick(message, 'secondary')"
          />
          <PrimeButton
            severity="secondary"
            v-if="message.action.primary"
            size="small"
            :label="message.action.primary.label"
            @click="handleClick(message, 'primary')"
          />
        </div>
      </div>
    </template>
  </Toast>
</template>

<script setup>
  import { ref } from 'vue'
  import PrimeButton from 'primevue/button'
  import Toast from 'primevue/toast'
  import Tag from 'primevue/tag'

  defineOptions({ name: 'ToastBlock' })

  const CHAR_LIMITS = {
    SUMMARY: 20,
    DETAIL: 125
  }

  const TOAST_LIFE = {
    DEFAULT: 5000,
    WITH_ACTIONS: 10000
  }

  const toastOptions = {
    root: {
      class: 'pl-3 pr-3 w-full md:w-[25rem] md:pl-0 md:pr-0 !right-0 md:right-8 top-[68px]'
    },
    content: {
      class: 'relative'
    },
    closeButton: {
      class: 'absolute right-5 top-5'
    },
    closeIcon: {
      class: 'text-color'
    }
  }

  const parseText = (text, charLimit) => {
    return text.substring(0, charLimit)
  }

  const showActions = (message) => {
    if (!message?.action) return false
    return Object.keys(message.action).length
  }

  const handleSeverity = (message) => {
    setToastLife(message)

    return parseSeverity(message)
  }

  const parseSeverity = (message) => {
    const severity = message.severity

    const parser = {
      error: 'danger',
      warn: 'warning'
    }

    return parser[severity] || severity
  }

  const setCustomIdOnAutoCloseMessage = (message) => {
    const customId = `${new Date().getTime()}${Math.floor(Math.random() * 1000)}`
    message.customId = customId

    return customId
  }

  const isAutoCloseable = (message) => {
    const closeableTypes = {
      success: {
        action: TOAST_LIFE.WITH_ACTIONS,
        default: TOAST_LIFE.DEFAULT
      },
      info: {
        action: TOAST_LIFE.WITH_ACTIONS,
        default: TOAST_LIFE.DEFAULT
      }
    }

    return closeableTypes[message.severity]
  }

  const getToastLifeTime = (message, toastType) => {
    const ZERO_VALUE = 0

    const shouldNotClose = message?.life == ZERO_VALUE
    const hasActions = message?.action && Object.keys(message.action).length

    const defaultLifeTime = hasActions ? toastType.action : toastType.default

    return shouldNotClose ? ZERO_VALUE : defaultLifeTime
  }

  const setToastLife = (message) => {
    const toastType = isAutoCloseable(message)

    if (toastType) {
      const customId = setCustomIdOnAutoCloseMessage(message)

      if (customId === message.customId) {
        message.life = getToastLifeTime(message, toastType)
      }
    }
  }

  const composeIconStyle = (severity) => {
    const parser = {
      error: 'pi pi-times text-xs',
      warn: 'pi pi-exclamation-triangle text-xs',
      success: 'pi pi-check text-xs',
      info: 'pi pi-info-circle text-xs'
    }

    return parser[severity] || 'pi pi-check text-xs'
  }

  const handleClick = (message, action) => {
    message.action[action].callback()
  }
</script>
