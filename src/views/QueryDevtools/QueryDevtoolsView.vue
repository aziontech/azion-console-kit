<template>
  <div class="p-6 space-y-6">
    <header class="space-y-2">
      <h1 class="text-2xl font-semibold text-gray-900">Query Devtools</h1>
      <p class="text-sm text-gray-600">
        Acompanhe o status das queries monitoradas pelo cliente base, incluindo ciclos de auto
        refresh e histórico de execuções.
      </p>
    </header>

    <div v-if="!rows.length" class="rounded border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
      Nenhuma query registrada até o momento. Faça uma requisição que use o cliente base para vê-la
      aparecer aqui.
    </div>

    <div v-else class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
          <tr>
            <th scope="col" class="px-4 py-3">Query</th>
            <th scope="col" class="px-4 py-3">Status</th>
            <th scope="col" class="px-4 py-3">Fetch em andamento</th>
            <th scope="col" class="px-4 py-3">Execuções</th>
            <th scope="col" class="px-4 py-3">Última atualização</th>
            <th scope="col" class="px-4 py-3">Duração</th>
            <th scope="col" class="px-4 py-3">Auto refresh</th>
            <th scope="col" class="px-4 py-3">Próximo refresh</th>
            <th scope="col" class="px-4 py-3">Erro</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 bg-white text-sm text-gray-800">
          <tr v-for="query in rows" :key="query.key" class="align-top">
            <td class="px-4 py-3 font-mono text-xs text-gray-900">{{ query.key }}</td>
            <td class="px-4 py-3 capitalize">{{ query.status }}</td>
            <td class="px-4 py-3">{{ query.isFetching ? 'Sim' : 'Não' }}</td>
            <td class="px-4 py-3">{{ query.fetchCount }}</td>
            <td class="px-4 py-3">{{ formatTimestamp(query.lastUpdatedAt) }}</td>
            <td class="px-4 py-3">{{ formatDuration(query.lastDuration) }}</td>
            <td class="px-4 py-3">
              <div class="space-y-1">
                <p>{{ query.isAutoRefreshing ? 'Ativo' : 'Inativo' }}</p>
                <p v-if="query.refetchInterval" class="text-xs text-gray-500">
                  Intervalo: {{ formatDuration(query.refetchInterval) }}
                </p>
              </div>
            </td>
            <td class="px-4 py-3">
              <div class="space-y-1">
                <p>{{ formatTimestamp(query.nextAutoRefreshAt) }}</p>
                <p v-if="query.nextAutoRefreshIn != null" class="text-xs text-gray-500">
                  Em {{ formatDuration(query.nextAutoRefreshIn) }}
                </p>
              </div>
            </td>
            <td class="px-4 py-3">
              <p v-if="query.error" class="max-w-xs break-words text-xs text-red-600">
                {{ query.error.message ?? query.error }}
              </p>
              <p v-else class="text-gray-400">—</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { queryDevtools } from '@/services/v2/base/query/queryDevtools'

const now = ref(Date.now())
let intervalId = null

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

const rows = computed(() =>
  queryDevtools.queries.value.map((query) => {
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
