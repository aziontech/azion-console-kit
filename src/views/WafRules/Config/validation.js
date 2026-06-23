import * as yup from 'yup'

// Shared WAF Rule form schema. Single source of truth for the create/edit
// forms and the VersionShell adapter (mirrors EdgeConnectors/Config/validation).
const validationSchema = yup.object({
  name: yup.string().required(),
  sqlInjection: yup.boolean(),
  sqlInjectionSensitivity: yup.string(),
  remoteFileInclusion: yup.boolean(),
  remoteFileInclusionSensitivity: yup.string(),
  directoryTraversal: yup.boolean(),
  directoryTraversalSensitivity: yup.string(),
  crossSiteScripting: yup.boolean(),
  crossSiteScriptingSensitivity: yup.string(),
  fileUpload: yup.boolean(),
  fileUploadSensitivity: yup.string(),
  evadingTricks: yup.boolean(),
  evadingTricksSensitivity: yup.string(),
  unwantedAccess: yup.boolean(),
  unwantedAccessSensitivity: yup.string(),
  identifiedAttack: yup.boolean(),
  identifiedAttackSensitivity: yup.string(),
  active: yup.boolean()
})

export { validationSchema }
