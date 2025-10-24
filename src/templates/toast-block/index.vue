<template>
  <Toast :pt="toastOptions">
    <template #message="{ message }">
      <div
        class="flex flex-column flex-grow"
        :data-testid="handleDataTestId(message)"
      >
        <header class="flex gap-2 items-center h-8 w-[calc(100%-2.5em)] max-w-2xl">
          <Tag
            :icon="composeIconStyle(message.severity)"
            :severity="handleSeverity(message)"
            :pt="{ icon: { class: 'mr-0' }, root: { class: 'w-6 h-6' } }"
          />
          <h5
            class="text-color text-base font-semibold truncate"
            :data-testid="handleDataTestIdInItem(message, 'title')"
          >
            {{ toUpperCaseTitleCase(parseText(message.summary, CHAR_LIMITS.SUMMARY)) }}
          </h5>
        </header>
        <div :class="{ 'max-h-32 overflow-y-auto': message.additionalDetails }">
          <p
            class="text-sm text-color-secondary font-normal mt-3"
            v-if="message.component"
          >
            <component
              :is="message.component"
              :v-bind="message.props"
            />
          </p>
          <p
            class="text-sm text-color-secondary font-normal mt-3"
            :class="{ 'max-h-32 overflow-y-auto': !message.additionalDetails }"
            v-if="message.detail"
            :data-testid="handleDataTestIdInItem(message, 'detail')"
          >
            {{ parseText(message.detail, CHAR_LIMITS.DETAIL, false) }}
          </p>
          <p
            class="text-sm text-color-secondary font-normal mt-3"
            v-if="message.additionalDetails"
          >
            {{ message.additionalDetails }}
          </p>
        </div>
        <div
          class="flex flex-row gap-2 align-self-end mt-5"
          v-if="showActions(message)"
        >
          <PrimeButton
            v-if="message.action.link"
            :data-testid="handleDataTestIdInItem(message, 'link')"
            link
            size="small"
            :label="message.action.link.label"
            @click="handleClick(message, 'link')"
          />
          <PrimeButton
            v-if="message.action.secondary"
            :data-testid="handleDataTestIdInItem(message, 'secondary')"
            outlined
            size="small"
            :icon="getButtonIcon(message.action.secondary)"
            :label="getButtonLabel(message.action.secondary)"
            @click="handleClick(message, 'secondary')"
            :disabled="isButtonAnimating(message.action.secondary)"
          />
          <PrimeButton
            v-if="message.action.primary"
            severity="secondary"
            :data-testid="handleDataTestIdInItem(message, 'primary')"
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
  import PrimeButton from 'primevue/button'
  import Toast from 'primevue/toast'
  import Tag from 'primevue/tag'
  import { reactive } from 'vue'

  defineOptions({ name: 'ToastBlock' })

  const CHAR_LIMITS = {
    // TODO: revert Summary to 20 when the writing team review the titles in other parts of the application
    SUMMARY: 100,
    DETAIL: 125
  }

  const animatingButtons = reactive(new Map())

  const toastOptions = {
    root: {
      class: 'pl-3 pr-3 w-full md:w-[25rem] md:pl-0 md:pr-0 !right-0 md:right-8 top-[4.25rem]'
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

  const isString = (str) => typeof str === 'string'

  const toUpperCaseTitleCase = (text) => {
    return text?.charAt(0).toUpperCase() + text.slice(1)
  }

  const parseText = (text, charLimit, isSummary = true) => {
    const existsAndIsString = text && isString(text)
    const isSummaryAndExists = existsAndIsString && isSummary
    const isDetailAndExists = existsAndIsString && !isSummary

    if (isSummaryAndExists) {
      return text.substring(0, charLimit)
    }
    if (isDetailAndExists) {
      return text
    }
    if (!text) {
      return ''
    }
    // eslint-disable-next-line no-console
    console.error('An unexpected error occurred', text)
    return 'An unexpected error occurred'
  }

  const showActions = (message) => {
    if (!message?.action) return false
    return !!Object.keys(message.action).length
  }

  const handleDataTestId = (message) => {
    const { summary, detail } = message || {}

    const summaryExists = summary && isString(summary)
    const detailExists = detail && isString(detail)

    const prefix = 'toast-block__content'

    if (summaryExists && detailExists) {
      return `${prefix}__${summary}${detail}`
    }

    if (summaryExists) {
      return `${prefix}__${summary}`
    }

    if (detailExists) {
      return `${prefix}__${detail}`
    }

    return prefix
  }

  const handleDataTestIdInItem = (message, item) => {
    const dataTestid = handleDataTestId(message)

    return `${dataTestid}__${item}`
  }

  const handleSeverity = (message) => {
    if (!message.customId) {
      setToastLife(message)
    }

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

  const setCustomId = (message) => {
    const customId = `${new Date().getTime()}${Math.floor(Math.random() * 1000)}`
    message.id = message.customId = customId
  }

  const isAutoCloseable = (severity) => {
    const TOAST_LIFE = {
      WITH_ACTIONS: 10000,
      DEFAULT: 5000
    }

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

    return closeableTypes[severity]
  }

  const getToastLifeTime = (message, toastType) => {
    // explicitly defined to not close the toast
    const ZERO_VALUE = 0

    if (message?.life || message?.life == ZERO_VALUE) return message.life

    const hasActions = showActions(message)

    return hasActions ? toastType.action : toastType.default
  }

  const setToastLife = (message) => {
    const toastType = isAutoCloseable(message.severity)
    setCustomId(message)

    if (toastType) {
      message.life = getToastLifeTime(message, toastType)
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

  const getButtonKey = (action) => {
    return `${action.label}-${action.animation?.time || 'default'}`
  }

  const isButtonAnimating = (action) => {
    if (!action.animation) return false
    return animatingButtons.has(getButtonKey(action))
  }

  const getButtonIcon = (action) => {
    if (!action.animation) return action.icon || null

    const buttonKey = getButtonKey(action)
    const isAnimating = animatingButtons.has(buttonKey)

    if (isAnimating) {
      return action.animation.icon
    }

    return action.icon || null
  }

  const getButtonLabel = (action) => {
    if (!action.animation) return action.label

    const buttonKey = getButtonKey(action)
    const isAnimating = animatingButtons.has(buttonKey)

    if (isAnimating) {
      return action.animation.label
    }

    return action.label
  }

  const startButtonAnimation = (action) => {
    if (!action.animation) return

    const buttonKey = getButtonKey(action)
    animatingButtons.set(buttonKey, true)

    setTimeout(() => {
      animatingButtons.delete(buttonKey)
    }, action.animation.time)
  }

  const handleClick = (message, action) => {
    const actionData = message.action[action]
    if (actionData.animation) {
      startButtonAnimation(actionData)
    }
    actionData.callback()
  }
</script>
