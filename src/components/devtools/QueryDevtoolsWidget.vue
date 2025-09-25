<template>
  <div
    v-if="isDevtoolsEnabled"
    class="fixed bottom-4 left-4 z-[9999] font-sans text-xs text-gray-800"
  >
    <button
      type="button"
      class="flex items-center gap-2 rounded-t bg-gray-900/90 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-white shadow-lg shadow-black/20 transition hover:bg-gray-900"
      @click="toggle"
    >
      <span class="inline-flex h-2 w-2 items-center justify-center">
        <span
          :class="[
            'inline-block h-2 w-2 rounded-full',
            fetchingCount > 0 ? 'bg-amber-400 animate-pulse' : errorsCount > 0 ? 'bg-red-500' : 'bg-emerald-400'
          ]"
        />
      </span>
      <span>Query Devtools</span>
      <span class="text-[10px] font-normal uppercase tracking-wider text-gray-300">
        {{ totalQueries }} query{{ totalQueries === 1 ? '' : 's' }} · {{ fetchingCount }} carregando ·
        {{ errorsCount }} com erro
      </span>
      <span
        class="ml-auto rounded bg-gray-700 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-100"
      >
        {{ isOpen ? 'Fechar' : 'Abrir' }}
      </span>
    </button>

    <transition name="fade-scale">
      <div
        v-if="isOpen"
        class="max-h-[65vh] w-[360px] overflow-hidden rounded-b border border-t-0 border-gray-900/80 bg-white shadow-2xl"
      >
        <header class="flex items-center justify-between bg-gray-900/80 px-3 py-2 text-[11px] text-gray-100">
          <div class="flex flex-col">
            <span class="font-semibold uppercase tracking-wide">Monitoramento de Queries</span>
            <span class="text-[10px] text-gray-300">
              Auto refresh ativo em {{ autoRefreshingCount }} query{{ autoRefreshingCount === 1 ? '' : 's' }}
            </span>
          </div>
          <button
            type="button"
            class="rounded bg-gray-800 px-2 py-1 text-[10px] uppercase tracking-wider text-gray-200 transition hover:bg-gray-700"
            @click="isOpen = false"
          >
            Ocultar
          </button>
        </header>

        <div class="max-h-[55vh] overflow-y-auto bg-white">
          <div v-if="!rows.length" class="px-3 py-4 text-[11px] text-gray-500">
            Nenhuma query registrada ainda. Execute uma requisição que utilize o cliente base para monitorá-la
            aqui.
          </div>

          <ul v-else class="divide-y divide-gray-200">
            <li v-for="query in rows" :key="query.key" class="px-3 py-3">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="truncate font-mono text-[11px] text-gray-900">{{ query.key }}</p>
                  <p class="text-[10px] uppercase tracking-wider text-gray-500">
                    {{ formatStatus(query.status) }} · {{ query.fetchCount }} execuções
                  </p>
                </div>
                <span
                  :class="[
                    'mt-0.5 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                    query.status === 'error'
                      ? 'bg-red-50 text-red-600'
                      : query.isFetching
                        ? 'bg-amber-50 text-amber-600'
                        : 'bg-emerald-50 text-emerald-600'
                  ]"
                >
                  {{ formatStatus(query.status) }}
                </span>
              </div>

              <dl class="mt-2 grid grid-cols-2 gap-2 text-[10px] text-gray-600">
                <div class="space-y-1">
                  <dt class="font-semibold uppercase tracking-wide text-gray-500">Última atualização</dt>
                  <dd>{{ formatTimestamp(query.lastUpdatedAt) }}</dd>
                </div>
                <div class="space-y-1">
                  <dt class="font-semibold uppercase tracking-wide text-gray-500">Duração</dt>
                  <dd>{{ formatDuration(query.lastDuration) }}</dd>
                </div>
                <div class="space-y-1">
                  <dt class="font-semibold uppercase tracking-wide text-gray-500">Auto refresh</dt>
                  <dd>
                    <span v-if="query.isAutoRefreshing">
                      Ativo em intervalos de {{ formatDuration(query.refetchInterval) }}
                    </span>
                    <span v-else>Inativo</span>
                  </dd>
                </div>
                <div class="space-y-1">
                  <dt class="font-semibold uppercase tracking-wide text-gray-500">Próximo refresh</dt>
                  <dd>
                    <span v-if="query.nextAutoRefreshAt">
                      {{ formatTimestamp(query.nextAutoRefreshAt) }}
                      <span v-if="query.nextAutoRefreshIn != null" class="text-[10px] text-gray-400">
                        (em {{ formatDuration(query.nextAutoRefreshIn) }})
                      </span>
                    </span>
                    <span v-else>—</span>
                  </dd>
                </div>
              </dl>

              <p v-if="query.error" class="mt-2 break-words text-[10px] text-red-600">
                {{ query.error.message ?? query.error }}
              </p>
            </li>
          </ul>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { queryDevtools } from '@/services/v2/base/query/queryDevtools'

const isDevtoolsEnabled = import.meta.env.DEV
const isOpen = ref(false)
const now = ref(Date.now())
let intervalId = null

const toggle = () => {
  isOpen.value = !isOpen.value
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    intervalId = window.setInterval(() => {
      now.value = Date.now()
    }, 1000)
  }
})

onBeforeUnmount(() => {
  if (intervalId != null) {
    clearInterval(intervalId)
    intervalId = null
  }
})

const queries = computed(() => queryDevtools.queries.value)

const rows = computed(() =>
  queries.value.map((query) => {
    const nextAutoRefreshIn =
      query.nextAutoRefreshAt != null ? Math.max(0, query.nextAutoRefreshAt - now.value) : null

    return {
      key: query.queryKey,
      status: query.status,
      isFetching: query.isFetching,
      fetchCount: query.fetchCount ?? 0,
      lastUpdatedAt: query.lastUpdatedAt,
      lastDuration: query.lastDuration,
      refetchInterval: query.refetchInterval,
      isAutoRefreshing: query.isAutoRefreshing,
      nextAutoRefreshAt: query.nextAutoRefreshAt,
      nextAutoRefreshIn,
      error: query.error
    }
  })
)

const totalQueries = computed(() => rows.value.length)
const fetchingCount = computed(() => rows.value.filter((row) => row.isFetching).length)
const errorsCount = computed(() => rows.value.filter((row) => row.status === 'error').length)
const autoRefreshingCount = computed(() => rows.value.filter((row) => row.isAutoRefreshing).length)

function formatStatus(status) {
  switch (status) {
    case 'error':
      return 'Erro'
    case 'loading':
      return 'Carregando'
    case 'success':
      return 'Sucesso'
    default:
      return 'Idle'
  }
}

function formatTimestamp(timestamp) {
  if (timestamp == null) return '—'
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(timestamp)
  } catch (error) {
    return String(timestamp)
  }
}

function formatDuration(duration) {
  if (duration == null) return '—'
  if (duration < 1000) {
    return `${Math.max(duration, 0)} ms`
  }
  const seconds = duration / 1000
  return `${seconds.toFixed(seconds < 10 ? 2 : 1)} s`
}
</script>

<style scoped>
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.97);
}
</style>
