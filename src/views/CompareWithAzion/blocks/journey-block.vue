<template>
  <div class="flex flex-col gap-6 mt-8">
    <h2 class="text-3xl mb-6">
      {{ data.title }}
    </h2>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
      <div
        v-for="item in data.items"
        :key="item.title"
        class="rounded surface-border border p-6 flex flex-col gap-6"
      >
        <h3 class="text-lg sm:text-xl font-medium">
          {{ item.title }}
        </h3>
        <p class="text-xs sm:text-sm text-color-secondary">
          {{ item.description }}
        </p>
        <div>
          <Button
            :label="item.button.label"
            :icon="item.button.icon"
            :outlined="item.button.outlined"
            @click="item.button.action"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { inject } from 'vue'
  import Button from 'primevue/button'
  import { useCreateModalStore } from '@/stores/create-modal'

  const createModalStore = useCreateModalStore()
  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const openModalCreate = () => {
    tracker.create
      .createEventInHomeAndHeader({ url: '/compare-with-azion', location: 'compare-with-azion' })
      .track()
    createModalStore.toggle()
  }

  const data = {
    title: 'Start your journey with Azion',
    items: [
      {
        title: 'Get Started',
        description: 'Welcome aboard! Feel free to explore or get a head start below.',
        button: {
          label: 'Create',
          icon: 'pi pi-plus',
          action: function () {
            openModalCreate()
          }
        }
      },
      {
        title: 'Connect with the Azion Discord Community',
        description:
          'Join our Discord community to get support, share ideas, and stay up-to-date on the latest Azion news and events.',
        button: {
          label: 'Azion Discord',
          icon: 'pi pi-discord',
          outlined: true,
          action: function () {
            window.open('https://discord.gg/pM8ANzztuB', '_blank')
          }
        }
      }
    ]
  }
</script>
