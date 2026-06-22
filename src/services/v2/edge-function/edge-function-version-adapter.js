/**
 * Edge Function version adapter — only the Function-specific exceptions; the
 * common normalization/payload logic comes from `createVersionAdapter`.
 */
import { createVersionAdapter } from '@/services/v2/versioning/version-adapter'
import { EdgeFunctionsAdapter } from './edge-function-adapter'

const RUNTIME_TO_UI = {
  azion_js: 'azion_js',
  azion_lua: 'azion_lua',
  javascript: 'azion_js',
  lua: 'azion_lua'
}

// The version snapshot may carry legacy serializer keys; coalesce them onto the
// canonical ones (`runtime`/`execution_environment`/`default_args`) before reuse.
const pick = (raw, canonical, legacy) => (raw[canonical] != null ? raw[canonical] : raw[legacy])

// Extracts the Function config from a full version snapshot (GET .../versions/{vid}).
// Output mirrors the edit form shape so it can initialize `useForm` directly.
const normalizeConfig = (raw) => {
  if (!raw || typeof raw !== 'object') return {}
  if (raw.code == null && raw.name == null) return {}

  const runtime = pick(raw, 'runtime', 'language')
  const executionEnvironment = pick(raw, 'execution_environment', 'runtime_environment')
  const defaultArgs = pick(raw, 'default_args', 'json_args')

  const ui = {}
  if (raw.name != null) ui.name = raw.name
  if (raw.active != null) ui.active = raw.active
  if (raw.code != null) ui.code = raw.code
  if (runtime != null) ui.runtime = RUNTIME_TO_UI[runtime] ?? runtime
  if (executionEnvironment != null) ui.executionEnvironment = executionEnvironment
  if (defaultArgs != null) ui.defaultArgs = JSON.stringify(defaultArgs, null, 2)
  if (raw.azion_form != null) ui.azionForm = raw.azion_form

  return ui
}

// Maps UI form values into the resource payload at the root. Returns `{}` for a
// bare clone so the API keeps the cloned values.
const mapResourceFields = (source = {}) => {
  const hasResourceFields =
    source.name !== undefined || source.code !== undefined || source.runtime !== undefined
  if (!hasResourceFields) return {}

  return EdgeFunctionsAdapter.transformPayloadEdgeFunctions({
    name: source.name,
    code: source.code,
    runtime: source.runtime,
    executionEnvironment: source.executionEnvironment,
    defaultArgs: source.defaultArgs ?? 'null',
    azionForm: source.azionForm,
    active: source.active
  })
}

export const EdgeFunctionVersionAdapter = createVersionAdapter({
  normalizeConfig,
  mapResourceFields
})
