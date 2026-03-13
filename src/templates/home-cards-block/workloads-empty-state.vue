<script setup>
  import { computed } from 'vue'
  import { useRouter } from 'vue-router'
  import PrimeButton from 'primevue/button'
  import Divider from 'primevue/divider'
  import { useCreateModalStore } from '@/stores/create-modal'

  const router = useRouter()
  const createModalStore = useCreateModalStore()

  const actionItems = computed(() => [
    {
      title: 'Import from GitHub',
      description: 'Import a repository from GitHub.',
      buttonLabel: 'Import',
      action: () => createModalStore.open('githubImport')
    },
    {
      title: 'Start from a Template',
      description: 'Choose a framework boilerplate.',
      buttonLabel: 'Templates',
      action: () => createModalStore.open('templates')
    },
    {
      title: 'Start from a Scratch',
      description: 'Start from a blank Workload.',
      buttonLabel: 'Create',
      action: handleCreateFromScratch
    }
  ])

  const handleCreateFromScratch = () => {
    router.push({ name: 'create-workload' })
  }
</script>

<template>
  <div
    class="flex flex-col flex-1 items-center justify-center w-full border border-[var(--surface-border)] rounded-md bg-[var(--surface-section)] min-h-[364px]"
  >
    <div class="flex flex-col gap-8 items-center justify-center max-w-[465px] px-4">
      <div class="flex flex-col gap-2 text-center">
        <p class="text-lg font-semibold text-[var(--text-color)]">No Workloads created yet</p>
        <p class="text-sm text-[var(--text-color-secondary)]">
          Create your first deploy starting from scratch, a template or importing your code.
        </p>
      </div>

      <div
        class="flex flex-col w-full bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-md py-2.5"
      >
        <template
          v-for="(item, index) in actionItems"
          :key="item.title"
        >
          <div class="flex items-center gap-2.5 px-4 py-2 w-full">
            <div class="flex flex-col gap-0.5 flex-1 text-xs">
              <p class="font-semibold text-[var(--text-color)]">{{ item.title }}</p>
              <p class="text-[var(--text-color-secondary)]">{{ item.description }}</p>
            </div>
            <PrimeButton
              :label="item.buttonLabel"
              outlined
              size="small"
              @click="item.action"
            />
          </div>
          <Divider
            v-if="index < actionItems.length - 1"
            class="my-1.5"
          />
        </template>
      </div>
    </div>
  </div>
</template>
