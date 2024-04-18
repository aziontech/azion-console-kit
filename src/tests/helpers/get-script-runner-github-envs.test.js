import { describe, expect, it, vi } from 'vitest'
import { getScriptRunnerGithubEnv } from '@/helpers/get-script-runner-github-envs'
import { getEnvironment } from '@/helpers'

vi.mock('@/helpers', () => ({
  getEnvironment: vi.fn()
}))

const fixtures = {
  validFormValues: {
    repository: 'https://github.com/example/repo',
    rootDirectory: '/src',
    preset: 'angular',
    mode: 'deliver',
    edgeApplicationName: 'ExampleApp',
    installCommand: 'npm install'
  },
  incompleteFormValues: {
    repository: '',
    rootDirectory: '/src',
    preset: 'angular',
    mode: 'deliver',
    edgeApplicationName: 'ExampleApp',
    installCommand: 'npm install'
  },
  environment: 'production',
  expectedConfigs: [
    {
      key: 'VCS_ACCESS_TOKEN',
      store: false,
      value: '{{context.vcs_integration.access_token}}'
    },
    {
      key: 'VCS_USER_ACCESS_TOKEN',
      store: false,
      value: '{{context.vcs_integration.user_access_token}}'
    },
    {
      key: 'VCS_PLATFORM',
      store: false,
      value: '{{context.vcs_integration.platform}}'
    },
    {
      key: 'VCS_SCOPE',
      store: false,
      value: '{{context.vcs_integration.scope}}'
    },
    {
      key: 'VCS_SCOPE_TYPE',
      store: false,
      value: '{{context.vcs_integration.scope_type}}'
    },
    {
      key: 'VULCAN_PRESET',
      store: false,
      value: 'angular'
    },
    {
      key: 'VULCAN_MODE',
      store: false,
      value: 'deliver'
    },
    {
      key: 'AZ_ENV',
      store: false,
      value: 'production'
    },
    {
      key: 'AZ_TASKS',
      store: false,
      value: 'JAMSTACK'
    },
    {
      key: 'AZ_URL',
      store: false,
      value: 'https://api.azion.com'
    },
    {
      key: 'DEBUG',
      store: false,
      value: true
    },
    {
      key: 'AZ_NAME',
      store: false,
      value: 'ExampleApp'
    },
    {
      key: 'AZ_COMMAND',
      store: false,
      value: 'npm install'
    },
    {
      key: 'GIT_EXTERNAL_URL',
      store: false,
      value: 'https://github.com/example/repo'
    },
    {
      key: 'AZ_TEMPLATE_NAME',
      store: false,
      value: 'external'
    },
    {
      key: 'WORK_DIR',
      store: false,
      value: '/src'
    },
    {
      key: 'IAM_URL',
      value: 'https://api.azion.com',
      store: false
    }
  ]
}

const makeSut = () => {
  const sut = getScriptRunnerGithubEnv
  return { sut }
}

describe('getScriptRunnerGithubEnv', () => {
  it('should return the correct configuration objects', () => {
    getEnvironment.mockReturnValue(fixtures.environment)

    const { sut } = makeSut()
    const result = sut(fixtures.validFormValues)
    expect(result).toEqual(fixtures.expectedConfigs)
  })

  it('should throw an error if a required field is empty', () => {
    getEnvironment.mockReturnValue(fixtures.environment)

    const { sut } = makeSut()

    expect(() => sut(fixtures.incompleteFormValues)).toThrow(
      'The "repository" field is required to Script Runner.'
    )
  })
})
