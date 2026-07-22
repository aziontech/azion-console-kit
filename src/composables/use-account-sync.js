import { watch } from 'vue'
import { storeToRefs } from 'pinia'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { accountService } from '@/services/v2/account'
import { useAccountStore } from '@/stores/account'

export function useAccountSync() {
  const accountStore = useAccountStore()
  const { hasSession } = storeToRefs(accountStore)

  const query = accountService.useQuery(
    queryKeys.account.info(),
    () => accountService.fetchAccountIdentity(),
    { enabled: hasSession, persist: false, staleTime: 0 }
  )

  watch(
    () => query.data.value,
    (identity) => {
      if (identity) accountStore.setIdentity(identity)
    },
    { immediate: true }
  )

  return query
}
