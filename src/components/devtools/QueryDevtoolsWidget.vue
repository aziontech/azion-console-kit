<template>
  <div
    v-if="isDevtoolsEnabled"
    class="pointer-events-none fixed inset-x-6 bottom-6 z-[9999] font-sans text-xs text-slate-100"
  >
    <div class="ml-auto flex max-w-full flex-col items-end gap-3">
      <button
        type="button"
        class="pointer-events-auto inline-flex items-center gap-3 rounded-full border border-slate-700/60 bg-slate-950/90 px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-100 shadow-lg shadow-black/30 backdrop-blur transition hover:border-slate-500 hover:bg-slate-900/90"
        @click="toggle"
      >
        <span class="inline-flex h-2.5 w-2.5 items-center justify-center">
          <span
            :class="[
              'inline-block h-2.5 w-2.5 rounded-full',
              fetchingCount > 0
                ? 'bg-amber-400 animate-pulse'
                : errorsCount > 0
                  ? 'bg-rose-400'
                  : 'bg-emerald-400'
            ]"
          />
        </span>
        <span class="tracking-[0.18em]">Query Devtools</span>
        <span class="text-[10px] font-medium uppercase tracking-widest text-slate-300">
          {{ totalQueries }} query{{ totalQueries === 1 ? '' : 's' }} · {{ fetchingCount }} carregando ·
          {{ errorsCount }} com erro
        </span>
        <span
          class="ml-auto rounded-full bg-slate-700/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-100"
        >
          {{ isOpen ? 'Fechar' : 'Abrir' }}
        </span>
      </button>

      <transition name="fade-scale">
        <section
          v-if="isOpen"
          class="pointer-events-auto w-full max-h-[70vh] overflow-hidden rounded-3xl border border-slate-700/60 bg-slate-950/95 shadow-2xl shadow-black/40 backdrop-blur"
        >
          <header class="flex flex-wrap items-center gap-4 border-b border-slate-800/70 bg-slate-950/70 px-6 py-4">
            <div class="flex flex-col gap-1">
              <span class="text-[12px] font-bold uppercase tracking-[0.2em] text-slate-200">
                Monitoramento de Queries
              </span>
              <span class="text-[11px] font-medium text-slate-400">
                Auto refresh ativo em {{ autoRefreshingCount }} query{{ autoRefreshingCount === 1 ? '' : 's' }} ·
                {{ errorsCount }} com erro
              </span>
            </div>
            <div class="ml-auto flex flex-wrap items-center gap-3 text-[11px] font-medium uppercase tracking-[0.18em]">
              <span class="inline-flex items-center gap-2 rounded-full bg-slate-900/90 px-3 py-1 text-slate-300">
                <span class="h-2 w-2 rounded-full bg-emerald-400" /> Sucesso: {{ successCount }}
              </span>
              <span class="inline-flex items-center gap-2 rounded-full bg-slate-900/90 px-3 py-1 text-slate-300">
                <span class="h-2 w-2 rounded-full bg-amber-400" /> Ativas: {{ fetchingCount }}
              </span>
              <span class="inline-flex items-center gap-2 rounded-full bg-slate-900/90 px-3 py-1 text-slate-300">
                <span class="h-2 w-2 rounded-full bg-rose-400" /> Erros: {{ errorsCount }}
              </span>
            </div>
            <button
              type="button"
              class="rounded-full border border-slate-700/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-200 transition hover:border-slate-500 hover:text-white"
              @click="isOpen = false"
            >
              Ocultar painel
            </button>
          </header>

          <div class="flex flex-col gap-4 overflow-hidden p-6">
            <div
              v-if="!rows.length"
              class="flex h-32 items-center justify-center rounded-2xl border border-dashed border-slate-700/60 bg-slate-900/40 text-[12px] text-slate-400"
            >
              Nenhuma query monitorada ainda. Execute uma requisição com o cliente base para acompanhá-la aqui.
            </div>

            <div v-else class="max-h-[48vh] overflow-auto">
              <table class="min-w-full divide-y divide-slate-800/80 text-[11px]">
                <thead class="sticky top-0 z-10 bg-slate-950/95 backdrop-blur">
                  <tr class="text-left uppercase tracking-[0.18em] text-slate-400">
                    <th scope="col" class="px-4 py-3 font-medium">Query</th>
                    <th scope="col" class="px-4 py-3 font-medium">Status</th>
                    <th scope="col" class="px-4 py-3 font-medium">Última atualização</th>
                    <th scope="col" class="px-4 py-3 font-medium">Auto refresh</th>
                    <th scope="col" class="px-4 py-3 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60 text-slate-200">
                  <tr v-for="query in rows" :key="query.key" class="align-top">
                    <td class="px-4 py-3">
                      <div class="flex flex-col gap-1">
                        <span class="font-mono text-[11px] text-slate-100">{{ query.key }}</span>
                        <span class="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                          {{ query.fetchCount }} execuções · duração {{ formatDuration(query.lastDuration) }}
                        </span>
                        <p v-if="query.error" class="mt-1 break-words text-[10px] text-rose-300">
                          {{ query.error.message ?? query.error }}
                        </p>
                      </div>
                    </td>
                    <td class="px-4 py-3">
                      <span
                        :class="[
                          'inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]',
                          query.status === 'error'
                            ? 'bg-rose-500/10 text-rose-200'
                            : query.isFetching
                              ? 'bg-amber-400/10 text-amber-200'
                              : 'bg-emerald-500/10 text-emerald-200'
                        ]"
                      >
                        <span
                          :class="[
                            'h-1.5 w-1.5 rounded-full',
                            query.status === 'error'
                              ? 'bg-rose-400'
                              : query.isFetching
                                ? 'bg-amber-300'
                                : 'bg-emerald-300'
                          ]"
                        />
                        {{ formatStatus(query.status) }}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-[10px] text-slate-300">
                      <div class="flex flex-col gap-1">
                        <span>{{ formatTimestamp(query.lastUpdatedAt) }}</span>
                        <span v-if="query.nextAutoRefreshAt" class="text-[10px] text-slate-500">
                          Próximo refresh em {{ formatDuration(query.nextAutoRefreshIn) }}
                        </span>
                      </div>
                    </td>
                    <td class="px-4 py-3 text-[10px] text-slate-300">
                      <div class="flex flex-col gap-2">
                        <span>
                          {{ query.isAutoRefreshing
                            ? `Intervalo de ${formatDuration(query.refetchInterval)}`
                            : 'Auto refresh inativo' }}
                        </span>
                        <div class="flex flex-wrap items-center gap-2">
                          <label :for="`interval-${query.key}`" class="text-[9px] uppercase tracking-[0.2em] text-slate-500">
                            Intervalo
                          </label>
                          <select
                            :id="`interval-${query.key}`"
                            v-model.number="selectedIntervals[query.key]"
                            class="rounded-full border border-slate-700/70 bg-slate-900/90 px-3 py-1 text-[10px] text-slate-200 focus:border-emerald-400 focus:outline-none"
                          >
                            <option
                              v-for="option in intervalOptions"
                              :key="option.value"
                              :value="option.value"
                            >
                              {{ option.label }}
                            </option>
                          </select>
                          <button
                            type="button"
                            class="rounded-full border border-emerald-500/40 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-200 transition hover:border-emerald-400 hover:text-emerald-100 disabled:cursor-not-allowed disabled:border-slate-700 disabled:text-slate-500"
                            :disabled="isActionPending(query.key, 'autoRefresh')"
                            @click="applyAutoRefresh(query.key)"
                          >
                            {{ query.isAutoRefreshing ? 'Atualizar' : 'Ativar' }}
                          </button>
                          <button
                            v-if="query.isAutoRefreshing"
                            type="button"
                            class="rounded-full border border-slate-700/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-300 transition hover:border-rose-400 hover:text-rose-200 disabled:cursor-not-allowed disabled:border-slate-700 disabled:text-slate-500"
                            :disabled="isActionPending(query.key, 'autoRefresh')"
                            @click="disableAutoRefresh(query.key)"
                          >
                            Pausar
                          </button>
                        </div>
                      </div>
                    </td>
                    <td class="px-4 py-3">
                      <div class="flex flex-wrap gap-2">
                        <button
                          type="button"
                          class="rounded-full border border-emerald-500/40 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-200 transition hover:border-emerald-400 hover:text-emerald-100 disabled:cursor-not-allowed disabled:border-slate-700 disabled:text-slate-500"
                          :disabled="isActionPending(query.key, 'refetch')"
                          @click="refetchNow(query.key)"
                        >
                          Refetch agora
                        </button>
                        <button
                          type="button"
                          class="rounded-full border border-slate-700/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-300 transition hover:border-amber-400 hover:text-amber-200 disabled:cursor-not-allowed disabled:border-slate-700 disabled:text-slate-500"
                          :disabled="isActionPending(query.key, 'invalidate')"
                          @click="invalidateCache(query.key)"
                        >
                          Invalidar cache
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { queryDevtools } from '@/services/v2/base/query/queryDevtools'
import { queryClient } from '@/services/v2/base/query/queryClient'

const isDevtoolsEnabled = import.meta.env.DEV
const isOpen = ref(false)
const now = ref(Date.now())
let intervalId = null
const selectedIntervals = reactive({})
const actionStates = reactive({})

const intervalOptions = [
  { label: '15 segundos', value: 15000 },
  { label: '30 segundos', value: 30000 },
  { label: '45 segundos', value: 45000 },
  { label: '60 segundos', value: 60000 },
  { label: '120 segundos', value: 120000 }
]

const DEFAULT_INTERVAL = 30000

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
const successCount = computed(() => rows.value.filter((row) => row.status === 'success').length)

watch(
  rows,
  (newRows) => {
    newRows.forEach((row) => {
      if (selectedIntervals[row.key] == null) {
        selectedIntervals[row.key] = row.refetchInterval ?? DEFAULT_INTERVAL
      }
    })

    Object.keys(selectedIntervals).forEach((key) => {
      if (!newRows.some((row) => row.key === key)) {
        delete selectedIntervals[key]
      }
    })
  },
  { immediate: true }
)

function ensureActionState(queryKey) {
  if (!actionStates[queryKey]) {
    actionStates[queryKey] = {
      refetch: false,
      invalidate: false,
      autoRefresh: false
    }
  }
  return actionStates[queryKey]
}

function isActionPending(queryKey, action) {
  return Boolean(actionStates[queryKey]?.[action])
}

async function runAction(queryKey, action, handler) {
  const state = ensureActionState(queryKey)
  if (state[action]) return
  state[action] = true
  try {
    await handler()
  } catch (error) {
    console.error('[QueryDevtoolsWidget]', action, queryKey, error)
  } finally {
    state[action] = false
  }
}

function refetchNow(queryKey) {
  return runAction(queryKey, 'refetch', () => queryClient.refetch(queryKey))
}

function invalidateCache(queryKey) {
  return runAction(queryKey, 'invalidate', () => queryClient.invalidate(queryKey))
}

function applyAutoRefresh(queryKey) {
  const interval = selectedIntervals[queryKey] ?? DEFAULT_INTERVAL
  return runAction(queryKey, 'autoRefresh', () => queryClient.setAutoRefresh(queryKey, interval))
}

function disableAutoRefresh(queryKey) {
  return runAction(queryKey, 'autoRefresh', () => queryClient.setAutoRefresh(queryKey, null))
}

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
  if (seconds >= 60) {
    const minutes = seconds / 60
    return `${minutes.toFixed(minutes < 10 ? 1 : 0)} min`
  }
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
