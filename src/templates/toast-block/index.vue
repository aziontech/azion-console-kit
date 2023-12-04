<template>
  <Toast
    class=""
    :pt="toast"
  >
    <template #message="slotProps">
      <div class="flex flex-column flex-grow">
        <header class="flex gap-2 items-center justify-between">
          <div class="flex gap-2 items-center">
            <Tag
              :icon="composeIconStyle(slotProps.message.severity)"
              :severity="parseSeverity(slotProps.message.severity)"
              :pt="{ icon: { class: 'mr-0' }, root: { class: 'w-6 h-6' } }"
            />
            <h5 class="text-color text-base font-semibold">
              {{ getTitle(slotProps.message.summary) }}
            </h5>
          </div>
        </header>
        <p
          class="text-sm font-normal mt-3"
          v-if="slotProps.message.detail"
        >
          {{ slotProps.message.detail }}
        </p>

        <!-- Link -->
        <PrimeButton
          v-if="slotProps.message.link"
          :label="slotProps.message.link.label"
          size="small"
          link
          class="align-self-end"
          @click="handleClick(slotProps.message, slotProps.message.link.callback)"
        />

        <div
          class="flex flex-row gap-2 align-self-end mt-5"
          v-if="slotProps.message.primary || slotProps.message.secondary"
        >
          <!-- Secondary Button -->
          <PrimeButton
            v-if="slotProps.message.secondary"
            outlined
            size="small"
            :label="slotProps.message.secondary.label"
            @click="handleClick(slotProps.message, slotProps.message.secondary.callback)"
          />
          <!-- Primary Button -->
          <PrimeButton
            severity="secondary"
            v-if="slotProps.message.primary"
            size="small"
            :label="slotProps.message.primary.label"
            @click="handleClick(slotProps.message, slotProps.message.primary.callback)"
          />
        </div>
      </div>
    </template>
  </Toast>
</template>

<script>
  import PrimeButton from 'primevue/button'
  import Toast from 'primevue/toast'
  import Tag from 'primevue/tag'

  export default {
    name: 'ToastBlock',
    components: {
      PrimeButton,
      Toast,
      Tag
    },
    data() {
      return {
        progress: [],
        toast: {
          root: {
            class: 'pl-3 pr-3 w-full md:w-[25rem] md:pl-0 md:pr-0 !right-0 md:right-8 top-[68px]'
          },
          content: {
            class: 'relative'
          },
          closeButton: {
            class: 'absolute right-4 top-3'
          },
          closeIcon: {
            class: 'text-color'
          }
        }
      }
    },
    methods: {
      getValue({ id }) {
        return this.progress.find((i) => i.id === id)?.value || 0
      },
      getProgressBarStyle({ severity }) {
        let color = 'black'
        if (severity === 'error') color = 'var(--button-danger-button-bg, #C4170B)'
        if (severity === 'warn') color = 'var(--button-warning-button-bg, #E9AE18)'
        if (severity === 'success') color = 'var(--button-success-button-bg, #198236)'
        if (severity === 'info') color = 'var(--button-button-bg, #282828)'

        return { value: { style: { background: color } } }
      },
      parseSeverity(severity) {
        if (severity === 'error') return 'danger'
        if (severity === 'warn') return 'warning'

        return severity
      },
      composeIconStyle(severity) {
        if (severity === 'error') return 'pi pi-times text-xs'
        if (severity === 'warn') return 'pi pi-exclamation-triangle text-xs'
        if (severity === 'success') return 'pi pi-check text-xs'
        if (severity === 'info') return 'pi pi-info-circle text-xs'
        return 'pi pi-check text-xs'
      },
      handleClick(message, callback) {
        callback()
        this.closeMessage(message)
      },
      closeMessage(message) {
        this.$toast.remove(message)
      },
      getTitle(str) {
        // const maxcharacters = 20
        // if (str.length > maxcharacters) {
        //   return str.substring(0, maxcharacters)
        // }
        return str
      },
      getSubtitle(str) {
        const maxcharacters = 125
        if (str.length > maxcharacters) {
          return str.substring(0, maxcharacters)
        }
        return str
      }
    }
  }
</script>
