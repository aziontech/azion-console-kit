import { BaseService } from '@/services/v2/base/query/baseService'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { useAccountStore } from '@/stores/account'

const ACTIVE_AS_TAG = {
  true: {
    content: 'Active',
    severity: 'success'
  },
  false: {
    content: 'Inactive',
    severity: 'danger'
  }
}

const OWNER_AS_TAG = {
  true: {
    content: 'Yes',
    severity: 'success'
  },
  false: {
    content: 'No',
    severity: 'info'
  }
}

const USERS_API_FIELDS = [
  'id',
  'first_name',
  'last_name',
  'email',
  'teams',
  'two_factor_enabled',
  'is_active',
  'is_account_owner',
  'last_modified'
]
const parseUser = (user) => {
  return {
    id: user.id,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    teams: user.teams.map((team) => team.name),
    mfa: ACTIVE_AS_TAG[user.two_factor_enabled],
    status: ACTIVE_AS_TAG[user.is_active],
    owner: OWNER_AS_TAG[user.is_account_owner]
  }
}

export class UsersService extends BaseService {
  constructor() {
    super()
    this.baseURL = 'v4/iam/users'
  }

  #fetchList = async (params = { pageSize: 10 }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.baseURL,
      params
    })

    const { user_id: userLoggedId } = useAccountStore().accountData
    const responseIsArray = Array.isArray(data.results)

    const removeUserIfItsMe = (user) => user.id !== userLoggedId
    const parsedUsers = responseIsArray ? data.results.map(parseUser).filter(removeUserIfItsMe) : []

    const count = data?.count ?? 0

    return { body: parsedUsers, count }
  }

  prefetchList = (pageSize = 10) => {
    const params = {
      page: 1,
      pageSize,
      fields: USERS_API_FIELDS,
      ordering: '-last_modified'
    }

    return this.usePrefetchQuery(queryKeys.users.list(params), () => this.#fetchList(params))
  }

  listUsers = async (params) => {
    const firstPage = params?.page === 1
    const skipCache = params?.skipCache || params?.hasFilter || params?.search

    return await this.useEnsureQueryData(
      queryKeys.users.list(params),
      () => this.#fetchList(params),
      {
        persist: firstPage && !skipCache,
        skipCache
      }
    )
  }

  getUserFromCacheById = (id) => {
    if (!id) return undefined

    return super.getFromCache({
      cacheKey: 'users',
      findFn: (item) => String(item.id) === String(id),
      mapFn: (item) => ({
        id: item.id,
        firstName: item.firstName,
        lastName: item.lastName,
        email: item.email
      }),
      listPath: 'body'
    })
  }
}

export const usersService = new UsersService()
