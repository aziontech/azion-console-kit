import { getEnvironment } from './get-environment'

const imagesMap = {
  stage: 'azionedge/azion-script-builder:edge-builder-stage-0.10.0',
  production: 'azionedge/azion-script-builder:edge-builder-stage-0.10.0'
}

/**
 * Function to get the script runner image based on the environment.
 *
 * @return {string} The script runner image for the current environment.
 */
export const getScriptRunnerImage = () => {
  const environment = getEnvironment()

  return imagesMap[environment] || imagesMap.stage
}
