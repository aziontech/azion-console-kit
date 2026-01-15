import { BaseService } from '@/services/v2/base/query/baseService'
import { queryKeys } from '@/services/v2/base/query/querySystem'

export class AccountSettingsService extends BaseService {
  baseUrl = 'v4/iam/account'

  async fetchAccountJobRole() {
    const response = await this.http.request({
      method: 'GET',
      url: this.baseUrl,
      config: { baseURL: '/api' }
    })
    return this._adaptJobRole(response.data)
  }

  async getAccountJobRole() {
    const queryKey = queryKeys.accountSettings.jobRole()
    return await this._ensureQueryData(queryKey, async () => this.fetchAccountJobRole())
  }

  _adaptJobRole(response) {
    const payload = response?.data
    if (!payload) return { jobRole: 'other' }

    return { jobRole: this._replaceLegacyJobRoles(payload.job_function) }
  }

  _replaceLegacyJobRoles(currentAccountJobRoleName) {
    const defaultJobRole = 'other'
    const validJobRoles = [
      'software-developer',
      'devops-engineer',
      'infrastructure-analyst',
      'network-engineer',
      'security-specialist',
      'data-engineer',
      'ai-ml-engineer',
      'iot-engineer',
      'team-lead',
      defaultJobRole
    ]

    const isJobRoleValid = validJobRoles.some((jobName) => jobName === currentAccountJobRoleName)
    return isJobRoleValid ? currentAccountJobRoleName : defaultJobRole
  }
}

export const accountSettingsService = new AccountSettingsService()
