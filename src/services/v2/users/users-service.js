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

const parseUser = (user) => {
  return {
    id: user.id,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    mobile: user.mobile,
    timezone: user.timezone,
    language: user.language,
    countryCallCode: user.country_call_code,
    teams: user.teams.map((team) => team.name),
    teamsIds: user.teams.map((team) => team.id),
    mfa: ACTIVE_AS_TAG[user.two_factor_enabled],
    status: ACTIVE_AS_TAG[user.is_active],
    owner: OWNER_AS_TAG[user.is_account_owner],
    isAccountOwner: user.is_account_owner,
    twoFactorEnabled: user.two_factor_enabled,
    isActive: user.is_active
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
      queryKey: queryKeys.users.all,
      id,
      listPath: 'body',
      select: (item) => {
        const firstName = item.firstName ?? ''
        const lastName = item.lastName ?? ''
        const name = `${firstName} ${lastName}`.trim() || item.email || 'User'

        return {
          id: item.id,
          firstName: item.firstName,
          lastName: item.lastName,
          email: item.email,
          name,
          mobile: item.mobile,
          timezone: item.timezone,
          language: item.language ?? 'en',
          countryCallCode: item.countryCallCode,
          isAccountOwner: item.isAccountOwner ?? item.owner?.content === 'Yes',
          twoFactorEnabled: item.twoFactorEnabled ?? item.mfa?.content === 'Active',
          isActive: item.isActive ?? item.status?.content === 'Active',
          teamsIds: item.teamsIds ?? []
        }
      }
    })
  }

  deleteUser = async (id) => {
    await this.http.request({
      method: 'DELETE',
      url: `${this.baseURL}/${id}`
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.users.all })

    return 'User successfully deleted'
  }

  createUser = async (payload) => {
    await this.http.request({
      method: 'POST',
      url: this.baseURL,
      body: {
        first_name: payload.firstName,
        last_name: payload.lastName,
        email: payload.email,
        language: payload.language,
        timezone: payload.timezone,
        country_call_code:
          payload.countryCallCode?.split(' - ').slice(1).join('-') || payload.countryCallCode,
        mobile: payload.mobile?.toString(),
        is_account_owner: payload.isAccountOwner,
        teams_ids: payload.teamsIds,
        two_factor_enabled: payload.twoFactorEnabled,
        is_active: payload.isActive
      }
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.users.all })

    return {
      feedback: 'Your user has been created',
      urlToEditView: '/users'
    }
  }

  editAnotherUser = async (payload) => {
    await this.http.request({
      method: 'PATCH',
      url: `${this.baseURL}/${payload.id}`,
      body: {
        first_name: payload.firstName,
        last_name: payload.lastName,
        email: payload.email,
        language: payload.language,
        timezone: payload.timezone,
        country_call_code:
          payload.countryCallCode?.split(' - ').slice(1).join('-') || payload.countryCallCode,
        mobile: payload.mobile?.toString(),
        is_account_owner: payload.isAccountOwner,
        teams_ids: payload.teamsIds,
        is_active: payload.isActive,
        two_factor_enabled: payload.twoFactorEnabled
      }
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.users.all })

    return 'Your user has been updated'
  }

  editUser = async (payload) => {
    const body = {
      first_name: payload.firstName,
      last_name: payload.lastName,
      email: payload.email,
      language: payload.language,
      timezone: payload.timezone,
      country_call_code:
        payload.countryCallCode?.split(' - ').slice(1).join('-') || payload.countryCallCode,
      mobile: payload.mobile?.toString(),
      two_factor_enabled: payload.twoFactorEnabled
    }

    if (payload.password) {
      body.old_password = payload.oldPassword
      body.password = payload.password
    }

    await this.http.request({
      method: 'PATCH',
      url: 'v4/iam/user',
      body
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.users.all })

    return 'Your user has been updated'
  }

  inviteTeamMember = async (payload) => {
    const parts = payload.name.split(' ')
    const firstName = parts[0]
    const lastName = parts.slice(1, parts.length).join(' ')

    await this.http.request({
      method: 'POST',
      url: this.baseURL,
      body: {
        first_name: firstName,
        last_name: lastName,
        email: payload.email,
        teams_ids: [payload.team]
      }
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.users.all })

    return 'Invite sent successfully'
  }
}

export const usersService = new UsersService()
