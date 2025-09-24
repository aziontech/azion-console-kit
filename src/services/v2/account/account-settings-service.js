import { BaseService } from '../base/BaseService'

export class AccountSettingsService extends BaseService {
  constructor() {
    super()
    this.baseURL = 'v4/iam/account'
  }

  async fetchAccountJobRole() {
    const response = await this.http.request({
      method: 'GET',
      url: this.baseURL,
      config: { baseURL: '/api' }
    })
    return this._adaptJobRole(response.data)
  }

  async getAccountJobRole(options = {}) {
    return await this.syncGlobalQuery(
      ['account', 'job-role'],
      () => this.fetchAccountJobRole(),
      options
    )
  }

  _adaptJobRole(response) {
    const payload = response?.data
    if (!payload) return { jobRole: 'other' }

    return {
      jobRole: this._replaceLegacyJobRoles(payload.job_function)
    }
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
