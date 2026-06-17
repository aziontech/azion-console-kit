<script setup>
  import { computed, ref, watch } from 'vue'
  import Dropdown from '@aziontech/webkit/dropdown'
  import Skeleton from '@aziontech/webkit/skeleton'
  import { useToast } from '@aziontech/webkit/use-toast'
  import Tag from '@aziontech/webkit/prime-tag'
  import OverlayPanel from '@aziontech/webkit/overlaypanel'
  import {
    resourcePackTypeMeta,
    getResourcePackRows
  } from '@/helpers/deployment-status'
  import CurrentBadge from '@/components/CurrentBadge'
  import { getWorkloadEnvironmentsService } from '@/services/v2/workload/workload-versions-mock'
  import { clipboardWrite } from '@/helpers/clipboard'

  defineOptions({ name: 'workload-environments-section' })

  const props = defineProps({
    workloadId: { type: [String, Number], required: true },
    workload: { type: Object, default: () => null }
  })

  const toast = useToast()

  const environments = ref([])
  const selectedEnvironment = ref(null)
  const isLoading = ref(true)

  const resourceMetaByKey = Object.fromEntries(resourcePackTypeMeta.map((meta) => [meta.key, meta]))

  const loadEnvironments = async () => {
    isLoading.value = true
    try {
      const result = await getWorkloadEnvironmentsService(props.workloadId)
      const list = Array.isArray(result?.body) ? result.body : []
      environments.value = list

      const production = list.find((env) => env.value === 'production')
      selectedEnvironment.value = production?.value || list[0]?.value || null
    } catch {
      environments.value = []
      selectedEnvironment.value = null
    } finally {
      isLoading.value = false
    }
  }

  watch(() => props.workloadId, loadEnvironments, { immediate: true })

  const selectedEnvironmentData = computed(() =>
    environments.value.find((env) => env.value === selectedEnvironment.value)
  )

  const selectedVersion = computed(() => selectedEnvironmentData.value?.version || null)

  const RESOURCE_SLOTS = 4
  const DOMAIN_SLOTS = 3

  const domainSlots = computed(() => {
    const domains = selectedEnvironmentData.value?.domains || []

    if (domains.length <= DOMAIN_SLOTS) {
      // eslint-disable-next-line id-length
      return Array.from({ length: DOMAIN_SLOTS }, (_, index) =>
        domains[index]
          ? { type: 'domain', key: domains[index].hostname, data: domains[index] }
          : { type: 'placeholder', key: `placeholder-${index}` }
      )
    }

    const visibleCount = DOMAIN_SLOTS - 1
    const visible = domains.slice(0, visibleCount).map((domain) => ({
      type: 'domain',
      key: domain.hostname,
      data: domain
    }))
    const remaining = domains.slice(visibleCount)
    return [
      ...visible,
      {
        type: 'overflow',
        key: 'domain-overflow',
        count: remaining.length,
        items: remaining
      }
    ]
  })

  const overflowPanelRef = ref(null)
  const showOverflowPanel = (event) => overflowPanelRef.value?.show(event)
  const hideOverflowPanel = () => overflowPanelRef.value?.hide()

  const resourceRows = computed(() => {
    const data = selectedEnvironmentData.value
    const rows = data
      ? getResourcePackRows({ resourcePack: data.resourcePack }).map((row) => ({
          ...row,
          iconClass: resourceMetaByKey[row.key]?.icon || row.icon,
          isEmpty: false
        }))
      : []

    const placeholders = Array.from(
      { length: Math.max(0, RESOURCE_SLOTS - rows.length) },
      // eslint-disable-next-line id-length
      (_, index) => ({
        key: `empty-${index}`,
        label: 'Empty Slot',
        name: '—',
        hash: '',
        iconClass: 'pi pi-circle',
        isEmpty: true
      })
    )

    return [...rows, ...placeholders]
  })

  const copyDomain = async (hostname) => {
    if (!hostname) return
    try {
      await clipboardWrite(hostname)
      toast.add({
        severity: 'success',
        summary: 'Domain copied to clipboard',
        life: 1500
      })
    } catch {
      toast.add({
        severity: 'warn',
        summary: 'Could not copy domain',
        life: 1500
      })
    }
  }
</script>

<template>
  <section
    class="flex flex-col gap-4 pb-4"
    data-testid="workload-overview__environments-section"
  >
    <header class="flex flex-wrap items-baseline justify-between gap-3">
      <h3 class="m-0 text-base font-semibold text-[var(--text-color)]">Current Configuration</h3>
      <span class="text-xs text-[var(--text-color-secondary)]">
        Pick an environment to see the domains it serves and the resources it pins.
      </span>
    </header>

    <div
      v-if="isLoading"
      class="grid grid-cols-1 gap-4 lg:grid-cols-2"
    >
      <div
        class="flex flex-col gap-3 rounded-md border border-[var(--surface-border)] bg-[var(--surface-card)] p-4"
      >
        <Skeleton
          width="220px"
          height="38px"
        />
        <Skeleton
          width="60%"
          height="20px"
        />
        <Skeleton
          width="100%"
          height="32px"
        />
        <Skeleton
          width="100%"
          height="32px"
        />
      </div>
      <div
        class="grid grid-cols-1 gap-2 rounded-md border border-[var(--surface-border)] bg-[var(--surface-card)] p-4 md:grid-cols-2"
      >
        <Skeleton
          v-for="index in 4"
          :key="index"
          width="100%"
          height="66px"
        />
      </div>
    </div>

    <div
      v-else-if="!environments.length"
      class="rounded-md border border-dashed border-[var(--surface-border)] px-4 py-8 text-center text-sm text-[var(--text-color-secondary)]"
      data-testid="workload-overview__environments-empty"
    >
      No deployment yet. Create your first Workload Version to ship to the edge.
    </div>

    <div
      v-else
      class="grid grid-cols-1 gap-4 lg:grid-cols-2"
    >
      <article
        class="flex flex-col gap-4 rounded-md border border-[var(--surface-border)] bg-[var(--surface-card)] p-4"
        data-testid="workload-overview__environment-card"
      >
        <div class="flex flex-col gap-2">
          <label
            class="text-[10px] font-medium uppercase leading-4 tracking-[1px] text-[var(--text-color-secondary)]"
          >
            Environment
          </label>
          <div class="flex flex-wrap items-center gap-2">
            <Dropdown
              v-model="selectedEnvironment"
              :options="environments"
              optionLabel="label"
              optionValue="value"
              appendTo="self"
              class="w-fit min-w-[180px]"
              data-testid="workload-overview__environment-select"
            >
              <template #option="slotProps">
                <span class="font-medium text-[var(--text-color)]">
                  {{ slotProps.option.label }}
                </span>
              </template>
            </Dropdown>
            <Tag
              v-if="selectedVersion?.tag"
              severity="primary"
              :value="selectedVersion.tag"
            />
            <CurrentBadge
              v-if="selectedVersion?.isLive"
              data-testid="workload-overview__environment-current-tag"
            />
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <label
            class="text-[10px] font-medium uppercase leading-4 tracking-[1px] text-[var(--text-color-secondary)]"
          >
            Domains
          </label>
          <ul
            class="flex flex-col gap-1.5"
            data-testid="workload-overview__environment-domains"
          >
            <li
              v-for="slot in domainSlots"
              :key="slot.key"
              class="flex items-center gap-2 rounded border px-3 py-2"
              :class="
                slot.type === 'placeholder'
                  ? 'border-dashed border-[var(--surface-border)] bg-transparent opacity-50'
                  : 'border-[var(--surface-border)] bg-[var(--surface-200)]'
              "
            >
              <template v-if="slot.type === 'domain'">
                <i
                  class="pi pi-link text-[var(--text-color-secondary)]"
                  style="font-size: 11px"
                />
                <a
                  :href="`https://${slot.data.hostname}`"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="min-w-0 flex-1 truncate text-sm text-[var(--text-color)] hover:text-[var(--primary-color)] hover:underline focus-visible:text-[var(--primary-color)] focus-visible:outline-none"
                  :title="`Open https://${slot.data.hostname} in a new tab`"
                >
                  {{ slot.data.hostname }}
                  <i
                    class="pi pi-external-link ml-1 align-middle text-[var(--text-color-secondary)]"
                    style="font-size: 9px"
                  />
                </a>
                <button
                  type="button"
                  class="flex h-6 w-6 items-center justify-center rounded text-[var(--text-color-secondary)] hover:bg-[var(--surface-200)] hover:text-[var(--text-color)]"
                  :title="`Copy ${slot.data.hostname}`"
                  :aria-label="`Copy ${slot.data.hostname}`"
                  @click="copyDomain(slot.data.hostname)"
                >
                  <i
                    class="pi pi-copy"
                    style="font-size: 11px"
                  />
                </button>
              </template>

              <template v-else-if="slot.type === 'overflow'">
                <i
                  class="pi pi-ellipsis-h text-[var(--text-color-secondary)]"
                  style="font-size: 11px"
                />
                <span class="min-w-0 flex-1 truncate text-sm text-[var(--text-color-secondary)]">
                  Other domains
                </span>
                <Tag
                  severity="info"
                  :value="`+${slot.count}`"
                  class="cursor-default"
                  tabindex="0"
                  aria-label="Show remaining domains"
                  @mouseenter="showOverflowPanel"
                  @mouseleave="hideOverflowPanel"
                  @focus="showOverflowPanel"
                  @blur="hideOverflowPanel"
                />
                <OverlayPanel
                  ref="overflowPanelRef"
                  :pt="{
                    root: { class: 'domain-overflow-panel' },
                    content: { class: 'p-0' }
                  }"
                >
                  <div class="flex w-max max-w-[28rem] flex-col gap-1.5 p-3">
                    <span
                      class="text-[10px] font-medium uppercase tracking-[0.0625rem] text-[var(--text-color-secondary)]"
                    >
                      Other domains
                    </span>
                    <div
                      v-for="domain in slot.items"
                      :key="domain.hostname"
                      class="flex items-center gap-2"
                    >
                      <i
                        class="pi pi-link text-[var(--text-color-secondary)]"
                        style="font-size: 11px"
                      />
                      <a
                        :href="`https://${domain.hostname}`"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="truncate text-xs text-[var(--text-color)] hover:text-[var(--primary-color)] hover:underline"
                      >
                        {{ domain.hostname }}
                      </a>
                    </div>
                  </div>
                </OverlayPanel>
              </template>

              <template v-else>
                <span
                  class="text-xs italic text-[var(--text-color-secondary)]"
                  aria-hidden="true"
                >
                  &nbsp;
                </span>
              </template>
            </li>
          </ul>
        </div>
      </article>

      <article
        class="flex flex-col gap-3 rounded-md border border-[var(--surface-border)] bg-[var(--surface-card)] p-4"
        data-testid="workload-overview__resources-card"
      >
        <label
          class="text-[10px] font-medium uppercase leading-4 tracking-[1px] text-[var(--text-color-secondary)]"
        >
          Resources
        </label>
        <div class="grid flex-1 auto-rows-fr grid-cols-1 gap-2 md:grid-cols-2">
          <div
            v-for="resource in resourceRows"
            :key="resource.key"
            class="flex h-full items-center gap-3 rounded-md border px-3 py-2.5"
            :class="
              resource.isEmpty
                ? 'border-dashed border-[var(--surface-border)] bg-transparent opacity-60'
                : 'border-[var(--surface-border)] bg-[var(--surface-200)]'
            "
            data-testid="workload-overview__resource"
          >
            <span
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
              :class="
                resource.isEmpty
                  ? 'bg-[var(--surface-200)] text-[var(--text-color-secondary)]'
                  : 'bg-[color-mix(in_srgb,var(--primary-color)_12%,transparent)] text-[var(--primary-color)]'
              "
            >
              <i
                :class="resource.iconClass"
                style="font-size: 14px"
              />
            </span>
            <div class="flex min-w-0 flex-1 flex-col">
              <span
                class="text-[10px] font-medium uppercase leading-4 tracking-[1px] text-[var(--text-color-secondary)]"
              >
                {{ resource.label }}
              </span>
              <span
                class="truncate text-sm font-medium leading-5 text-[var(--text-color)]"
                :title="resource.name"
              >
                {{ resource.name }}
              </span>
              <span class="flex items-center gap-1.5 text-xs text-[var(--text-color-secondary)]">
                <span class="font-mono">{{ resource.hash || '—' }}</span>
              </span>
            </div>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
  :deep(.domain-overflow-panel) {
    border: 1px solid var(--surface-border);
    border-radius: 0.5rem;
    background: var(--surface-section);
    box-shadow: 0 8px 24px color-mix(in srgb, var(--surface-900, #111827) 16%, transparent);
  }
</style>
