<script setup>
  import { computed, ref } from 'vue'
  import Accordion from 'primevue/accordion'
  import AccordionTab from '@aziontech/webkit/accordion-tab'
  import Button from '@aziontech/webkit/button'
  import InputText from 'primevue/inputtext'
  import { useToast } from '@aziontech/webkit/use-toast'
  import InlineTag from '@/components/InlineTag'

  defineOptions({ name: 'deployment-logs-accordion' })

  const props = defineProps({
    logs: {
      type: Array,
      default: () => []
    },
    title: {
      type: String,
      default: 'Deployment Logs'
    }
  })

  const toast = useToast()
  const searchQuery = ref('')
  const activeIndex = ref(0)

  const lineCount = computed(() => props.logs.length)

  const warningsCount = computed(() => props.logs.filter((log) => log.level === 'warning').length)

  const errorsCount = computed(() => props.logs.filter((log) => log.level === 'error').length)

  const filteredLogs = computed(() => {
    const query = searchQuery.value.trim().toLowerCase()
    if (!query) return props.logs
    return props.logs.filter(
      (log) =>
        log.content?.toLowerCase().includes(query) || log.timestamp?.toLowerCase().includes(query)
    )
  })

  const levelClass = (level) => {
    if (level === 'warning') return 'text-[#FFB64D]'
    if (level === 'error') return 'text-[#F53D3D]'
    return 'text-[var(--text-color)]'
  }

  const copyLogs = async () => {
    const text = props.logs.map((log) => `${log.timestamp}  ${log.content}`).join('\n')
    try {
      await navigator.clipboard.writeText(text)
      toast.add({
        closable: true,
        severity: 'success',
        summary: 'Logs copied to clipboard'
      })
    } catch {
      toast.add({
        closable: true,
        severity: 'error',
        summary: 'Failed to copy logs'
      })
    }
  }
</script>

<template>
  <Accordion
    v-model:activeIndex="activeIndex"
    data-testid="deployment-logs-accordion"
  >
    <AccordionTab
      :header="title"
      :pt="{
        content: { class: 'p-0' },
        headerTitle: { class: 'w-full' }
      }"
    >
      <div
        class="flex items-center justify-between gap-3 px-3 py-2 border-b border-[var(--surface-border)]"
      >
        <div class="flex items-center gap-2">
          <Button
            text
            size="small"
            icon="pi pi-copy"
            data-testid="deployment-logs-accordion__copy"
            aria-label="Copy logs"
            @click="copyLogs"
          />
          <span class="text-xs text-[var(--text-color-secondary)] whitespace-nowrap">
            {{ lineCount }} lines
          </span>
        </div>
        <div class="flex items-center gap-3 flex-wrap">
          <InlineTag
            v-if="warningsCount"
            :text="`${warningsCount} ${warningsCount === 1 ? 'Warning' : 'Warnings'}`"
            type="warning"
            icon="pi pi-exclamation-triangle"
            data-testid="deployment-logs-accordion__warnings"
            class="self-center"
          />
          <InlineTag
            v-if="errorsCount"
            :text="`${errorsCount} ${errorsCount === 1 ? 'Error' : 'Errors'}`"
            type="danger"
            icon="pi pi-times-circle"
            data-testid="deployment-logs-accordion__errors"
            class="self-center"
          />
          <span class="p-input-icon-left">
            <i class="pi pi-search text-xs text-[var(--text-color-secondary)]" />
            <InputText
              v-model="searchQuery"
              placeholder="Find in Logs"
              class="text-sm h-8"
              data-testid="deployment-logs-accordion__search"
            />
          </span>
        </div>
      </div>

      <div
        class="bg-[var(--surface-section)] max-h-80 overflow-auto font-mono text-xs leading-relaxed py-2 px-3"
        data-testid="deployment-logs-accordion__viewport"
      >
        <div
          v-for="(log, index) in filteredLogs"
          :key="`${log.timestamp}-${index}`"
          class="flex gap-4 py-0.5"
        >
          <span class="text-[var(--text-color-secondary)] shrink-0 select-none">
            {{ log.timestamp }}
          </span>
          <span :class="[levelClass(log.level), 'whitespace-pre-wrap break-words']">
            {{ log.content }}
          </span>
        </div>
        <div
          v-if="!filteredLogs.length"
          class="text-xs text-[var(--text-color-secondary)] py-3 text-center"
        >
          No logs match this search.
        </div>
      </div>
    </AccordionTab>
  </Accordion>
</template>
