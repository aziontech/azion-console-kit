import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeTemplateEngineBaseUrl } from './make-template-engine-base-url'

const TEMPLATE_INFO_KEYS = {
  NAME: 'TEMPLATE_INFO_NAME',
  MESSAGE: 'TEMPLATE_INFO_MESSAGE',
  PATH: 'TEMPLATE_INFO_PATH',
  URL: 'TEMPLATE_INFO_URL'
}

/**
 * Parses instantiation_data and extracts template info
 * The instantiation_data can be:
 * - A JSON string containing { templateTitle, templateDescription, templatePath, imagePreview, envs: [...] }
 * - An already parsed object
 * - An array directly (old format)
 *
 * Priority: direct properties > envs array entries
 *
 * @param {string|Object|Array} instantiationData - The raw instantiation_data
 * @returns {Object} Template info object with title, description, path, url, imagePreview
 */
const extractTemplateInfo = (instantiationData) => {
  let parsedData = null
  let envsArray = null

  // If it's a string, parse it as JSON
  if (typeof instantiationData === 'string') {
    try {
      parsedData = JSON.parse(instantiationData)
      envsArray = parsedData?.envs ?? null
    } catch {
      return {
        title: '',
        description: '',
        templatePath: '',
        repository_url: '',
        preview_image: ''
      }
    }
  }
  // If it's an object
  else if (instantiationData && typeof instantiationData === 'object') {
    if (Array.isArray(instantiationData)) {
      // Direct array (old format)
      envsArray = instantiationData
      parsedData = {}
    } else {
      // Object with potential direct properties and/or envs array
      parsedData = instantiationData
      envsArray = instantiationData.envs ?? null
    }
  }

  // Helper to find value in envs array
  const findInEnvs = (key) => {
    if (!envsArray || !Array.isArray(envsArray)) return ''
    const item = envsArray.find((entry) => entry.key === key)
    return item?.value ?? ''
  }

  // Priority: direct properties > envs array entries
  // New API fields: description, repository_url, preview_url, preview_image
  return {
    templateTitle: parsedData?.templateTitle ?? findInEnvs(TEMPLATE_INFO_KEYS.NAME) ?? '',
    templateDescription:
      parsedData?.templateDescription ??
      parsedData?.description ??
      findInEnvs(TEMPLATE_INFO_KEYS.MESSAGE) ??
      '',
    templatePath:
      parsedData?.templatePath ??
      parsedData?.repository_url ??
      findInEnvs(TEMPLATE_INFO_KEYS.PATH) ??
      '',
    templateUrl:
      parsedData?.templateUrl ??
      parsedData?.preview_url ??
      findInEnvs(TEMPLATE_INFO_KEYS.URL) ??
      '',
    imagePreview: parsedData?.imagePreview ?? parsedData?.preview_image ?? ''
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
        (property.instantiation_data_path !== undefined &&
          property.instantiation_data_path !== '') ||
        property.isSettingField === true
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
      // Priority: instantiation_data > API response
      imagePreview: templateInfo.imagePreview || httpResponse.body.imagePreview || '',
      templateTitle: templateInfo.templateTitle,
      templateDescription: templateInfo.templateDescription,
      templatePath: templateInfo.templatePath,
      templateUrl: templateInfo.templateUrl
    },
    statusCode: httpResponse.statusCode
  }
}
