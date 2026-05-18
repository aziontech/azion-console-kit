// Re-export the shared composable from its canonical location.
// The query history is not Events-specific — it is shared between
// Real-Time Events and Real-Time Metrics via the unified AdvancedFilterSystem.
export { useQueryHistory } from '@/composables/useQueryHistory'
