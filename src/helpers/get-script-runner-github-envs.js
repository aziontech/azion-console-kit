import { getEnvironment } from '@/helpers'

/**
 * Returns an array of configuration objects for script runner related to VCS (Version Control System) integration.
 *
 * @return {Array} An array of configuration objects. Each object has the following properties:
 *   - key (string): The key for the configuration.
 *   - value (string): The value for the configuration. It is a placeholder that will be replaced for the API.
 *   - store (boolean): Indicates whether the value should be stored or not.
 */
const getVCSEnvs = () => [
  {
    key: 'VCS_ACCESS_TOKEN',
    value: '{{context.vcs_integration.access_token}}',
    store: false
  },
  {
    key: 'VCS_USER_ACCESS_TOKEN',
    value: '{{context.vcs_integration.user_access_token}}',
    store: false
  },
  {
    key: 'VCS_PLATFORM',
    value: '{{context.vcs_integration.platform}}',
    store: false
  },
  {
    key: 'VCS_SCOPE',
    value: '{{context.vcs_integration.scope}}',
    store: false
  },
  {
    key: 'VCS_SCOPE_TYPE',
    value: '{{context.vcs_integration.scope_type}}',
    store: false
  }
]

/**
 * Generates the Vulcan configuration based on the provided form values.
 *
 * @param {Object} formValues - The form values used for configuration.
 * @param {string} formValues.preset - The Vulcan preset.
 * @param {string} formValues.mode - The Vulcan mode.
 * @return {Array} An array of Vulcan configuration objects.
 */
const getVulcanEnvs = (formValues) => [
  {
    key: 'VULCAN_PRESET',
    value: formValues.preset,
    store: false
  },
  {
    key: 'VULCAN_MODE',
    value: formValues.mode,
    store: false
  }
]

/**
 * Returns an array of configuration objects for the script runner required to run the image.
 *
 * @param {string} environment - The environment in which the script runner will run.
 * @return {Array} An array of configuration objects with the following properties:
 *  - key: The key of the configuration.
 *  - value: The value of the configuration.
 *  - store: A boolean indicating whether the configuration should be stored.
 */
const getScriptRequiredEnvs = (environment, apiUrlTarget) => [
  {
    key: 'AZ_ENV',
    value: environment,
    store: false
  },
  {
    key: 'AZ_TASKS',
    value: 'JAMSTACK',
    store: false
  },
  {
    key: 'AZ_URL',
    value: apiUrlTarget,
    store: false
  },
  {
    key: 'DEBUG',
    value: true,
    store: false
  }
]

/**
 * Retrieves the configuration values for the Edge App form.
 *
 * @param {Object} formValues - The form values used for configuration.
 * @return {Array} An array of configuration objects for the Edge App form.
 */
const getEdgeAppFormEnvs = (formValues) => [
  {
    key: 'AZ_NAME',
    value: formValues.edgeApplicationName,
    store: false
  },
  {
    key: 'AZ_COMMAND',
    value: formValues.installCommand,
    store: false
  },
  {
    key: 'GIT_EXTERNAL_URL',
    value: formValues.repository,
    store: false
  },
  {
    key: 'AZ_TEMPLATE_NAME',
    value: 'external',
    store: false
  },
  {
    key: 'WORK_DIR',
    value: formValues.rootDirectory,
    store: false
  }
]

/**
 * Validates the form values to ensure that required fields are not empty.
 *
 * @param {Object} formValues - The form values used for configuration.
 * @throws Will throw an error if a required field is empty.
 */
const validateFormValues = (formValues) => {
  const requiredFields = [
    'repository',
    'rootDirectory',
    'preset',
    'mode',
    'edgeApplicationName',
    'installCommand'
  ]

  for (const field of requiredFields) {
    if (!formValues[field]) {
      throw new Error(`The "${field}" field is required to Script Runner.`)
    }
  }
}

/**
 * Generates the GitHub environment configuration for the script runner based on the provided form values.
 *
 * @param {Object} formValues - The form values used for configuration.
 * @param {string} formValues.repository - The repository URL.
 * @param {string} formValues.rootDirectory - The root directory.
 * @param {string} formValues.preset - The Vulcan preset.
 * @param {string} formValues.mode - The Vulcan mode.
 * @param {string} formValues.edgeApplicationName - The name of the Edge application.
 * @param {string} formValues.installCommand - The installation command.
 * @return {Array} An array of GitHub environment configuration objects. Each object has the following properties:
 *   - key (string): The key for the configuration.
 *   - value (string): The value for the configuration.
 *   - store (boolean): Indicates whether the value should be stored or not.
 */
export const getScriptRunnerGithubEnv = (formValues) => {
  validateFormValues(formValues)
  const environment = getEnvironment()
  const URLStartPrefix = environment === 'production' ? 'https://' : 'https://stage-'
  const apiUrlTarget = `${URLStartPrefix}api.azion.com`

  return [
    ...getVCSEnvs(),
    ...getVulcanEnvs(formValues),
    ...getScriptRequiredEnvs(environment, apiUrlTarget),
    ...getEdgeAppFormEnvs(formValues),
    {
      key: 'IAM_URL',
      value: apiUrlTarget,
      store: false
    }
  ]
}
