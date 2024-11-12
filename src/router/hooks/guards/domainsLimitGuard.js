import { listWorkloadsService } from '@/services/workloads-services'
/** @type {import('vue-router').NavigationGuardWithThis} */

export async function domainsLimitGuard({ to, accountStore }) {
  const { hasActiveUserId } = accountStore
  if (!hasActiveUserId) {
    return true
  }

  const isCreateOrEditDataStream =
    to.name === 'create-data-stream' || to.name === 'edit-data-stream'
  if (isCreateOrEditDataStream) {
    const workloads = await listWorkloadsService({
      fields: 'id',
      ordering: 'id',
      page: 1,
      pageSize: 1
    })
    const isMaxDomainsReached = workloads.count >= 3000
    if (isMaxDomainsReached) {
      return '/'
    }
  }
}
