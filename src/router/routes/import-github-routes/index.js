import * as VersionControlSystemService from '@/services/version-control-system-integration-services'
import * as VulcanService from '@/services/vulcan-services'
import * as ScriptRunnerService from '@/services/script-runner-service'

/** @type {import('vue-router').RouteRecordRaw} */
export const importGithubRoutes = {
  path: '/import-github',
  name: 'import-github',
  children: [
    {
      path: 'static',
      name: 'github-static',
      component: () => import('@views/ImportGitHub/ImportStaticView.vue'),
      props: {
        listPlatformsService: VersionControlSystemService.listPlatformsService,
        postCallbackUrlService: VersionControlSystemService.postCallbackUrlService,
        listIntegrationsService: VersionControlSystemService.listIntegrationsService,
        listRepositoriesService: VersionControlSystemService.listRepositoriesService,
        listVulcanPresetsService: VulcanService.listVulcanPresetsService,
        getModesByPresetService: VulcanService.getModesByPresetService,
        createScriptRunnerExecutionService: ScriptRunnerService.createScriptRunnerExecutionService
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Import Static Site from GitHub',
            to: '/import-github'
          }
        ]
      }
    }
  ]
}
