import { getEnvironment } from './get-environment'

const imagesMap = {
  stage: 'azionedge/runner-static-website-with-cli-stage:2.1-alpine3.16',
  production: 'azionedge/runner-static-website-with-cli:2.1-alpine3.16'
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
