<template>
  <Toast>
    <template #message="slotProps">
      <div class="flex flex-column flex-grow">
        <header class="flex gap-2 items-center justify-between">
          <div class="flex gap-2 items-center">
            <Tag
              :icon="composeIconStyle(slotProps.message.severity)"
              :severity="parseSeverity(slotProps.message.severity)"
              :pt="{ icon: { class: 'mr-0' } }"
            />
            <h5 class="text-color text-base font-semibold">{{ slotProps.message.summary }}</h5>
          </div>

          <!-- Link -->
          <PrimeButton
            v-if="slotProps.message.link"
            :label="slotProps.message.link.label"
            size="small"
            link
            class="align-self-end"
            @click="handleClick(slotProps.message, slotProps.message.link.callback)"
          />
        </header>
        <p
          class="text-sm mt-3"
          v-if="slotProps.message.detail"
        >
          {{ slotProps.message.detail }}
        </p>

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
            v-if="slotProps.message.primary"
            size="small"
            :label="slotProps.message.primary.label"
            @click="handleClick(slotProps.message, slotProps.message.primary.callback)"
          />
        </div>

        <template v-bind="startProgress(slotProps.message)"></template>
        <ProgressBar
          v-if="slotProps.message.life"
          class="mt-4"
          :value="getValue(slotProps.message)"
          style="height: 6px"
          :show-value="false"
          :pt="getProgressBarStyle(slotProps.message)"
        ></ProgressBar>
      </div>
    </template>
  </Toast>
</template>

<script>
  import PrimeButton from 'primevue/button'
  import Toast from 'primevue/toast'
  import Tag from 'primevue/tag'
  import ProgressBar from 'primevue/progressbar'

  export default {
    name: 'ToastBlock',
    components: {
      PrimeButton,
      Toast,
      Tag,
      ProgressBar
    },
    data() {
      return {
        progress: []
      }
    },
    methods: {
      startProgress({ id, life }) {
        if (this.progress.find((i) => i.id === id)) {
          return
        }

        let value = 0
        const frameTime = 120
        this.progress.push({ id, value, life })

        const load = () => {
          let message = this.progress.find((i) => i.id === id)
          let value = message.value

          const coef = frameTime / life + 0.006
          message.value = value + coef * 100

          if (value <= 100) {
            setTimeout(() => load(), frameTime)
          }
        }

        load()
      },
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
      }
    }
  }
</script>
