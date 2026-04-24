import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeTemplateEngineBaseUrl } from './make-template-engine-base-url'

const TEMPLATE_INFO_KEYS = {
  NAME: 'TEMPLATE_INFO_NAME',
  MESSAGE: 'TEMPLATE_INFO_MESSAGE',
  PATH: 'TEMPLATE_INFO_PATH',
  URL: 'TEMPLATE_INFO_URL'
}

/**
 * Parses instantiation_data and extracts template info from envs array
 * The instantiation_data can be:
 * - A JSON string containing { envs: [...] }
 * - An already parsed object with envs array
 * - An array directly
 * @param {string|Object|Array} instantiationData - The raw instantiation_data
 * @returns {Object} Template info object with title, description, path, url
 */
const extractTemplateInfo = (instantiationData) => {
  let envsArray = null

  // If it's a string, parse it as JSON
  if (typeof instantiationData === 'string') {
    try {
      const parsed = JSON.parse(instantiationData)
      envsArray = parsed?.envs ?? null
    } catch {
      return {
        templateTitle: '',
        templateDescription: '',
        templatePath: '',
        templateUrl: ''
      }
    }
  }
  // If it's an object with envs property
  else if (instantiationData && typeof instantiationData === 'object') {
    if (Array.isArray(instantiationData)) {
      // Direct array (old format)
      envsArray = instantiationData
    } else if (instantiationData.envs && Array.isArray(instantiationData.envs)) {
      // Object with envs array
      envsArray = instantiationData.envs
    }
  }

  if (!envsArray || !Array.isArray(envsArray)) {
    return {
      templateTitle: '',
      templateDescription: '',
      templatePath: '',
      templateUrl: ''
    }
  }

  const findValue = (key) => {
    const item = envsArray.find((entry) => entry.key === key)
    return item?.value ?? ''
  }

  return {
    templateTitle: findValue(TEMPLATE_INFO_KEYS.NAME),
    templateDescription: findValue(TEMPLATE_INFO_KEYS.MESSAGE),
    templatePath: findValue(TEMPLATE_INFO_KEYS.PATH),
    templateUrl: findValue(TEMPLATE_INFO_KEYS.URL)
  }
}

export const getTemplate = async (templateId) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeTemplateEngineBaseUrl()}/templates/${templateId}`,
    method: 'GET'
  })
  httpResponse = adapt(httpResponse)
  return parseHttpResponse(httpResponse)
}

const checkHasSettings = (inputSchema) => {
  if (!inputSchema) return false

  // Check if properties object has any field with instantiation_data_path
  if (inputSchema.properties && typeof inputSchema.properties === 'object') {
    const properties = inputSchema.properties
    return Object.values(properties).some(
      (property) =>
        property.instantiation_data_path !== undefined && property.instantiation_data_path !== ''
    )
  }

  // Fallback: check groups
  if (inputSchema.groups && Array.isArray(inputSchema.groups)) {
    return inputSchema.groups.length > 1
  }

  return false
}

const adapt = (httpResponse) => {
  const instantiationData = httpResponse.body.instantiation_data
  const templateInfo = extractTemplateInfo(instantiationData)
  const inputSchema = httpResponse.body.input_schema

  return {
    body: {
      createdAt: httpResponse.body.created_at,
      inputSchema,
      instantiationData,
      isActive: httpResponse.body.is_active,
      name: httpResponse.body.name,
      templateType: httpResponse.body.template_type,
      updatedAt: httpResponse.body.updated_at,
      uuid: httpResponse.body.uuid,
      hasSettings: checkHasSettings(inputSchema),
      imagePreview: httpResponse.body.imagePreview,
      templateTitle: templateInfo.templateTitle,
      templateDescription: templateInfo.templateDescription,
      templatePath: templateInfo.templatePath,
      templateUrl: templateInfo.templateUrl
    },
    statusCode: httpResponse.statusCode
  }
}
