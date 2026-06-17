<script setup>
  import { useField } from 'vee-validate'
  import Accordion from 'primevue/accordion'
  import AccordionTab from '@aziontech/webkit/accordion-tab'
  import FieldDropdown from '@aziontech/webkit/field-dropdown'
  import FieldDropdownLazyLoader from '@aziontech/webkit/field-dropdown-lazy-loader'
  import FieldText from '@aziontech/webkit/field-text'
  import FieldNumber from '@aziontech/webkit/field-number'
  import FieldSwitchBlock from '@aziontech/webkit/field-switch-block'
  import { edgeAppService } from '@/services/v2/edge-app/edge-app-service'
  import { edgeFirewallService } from '@/services/v2/edge-firewall/edge-firewall-service'
  import { customPageService } from '@/services/v2/custom-page/custom-page-service'
  import { ROLLOUT_MODE_OPTIONS } from '@/views/Deployments/Config/createVersionValidation'

  defineOptions({ name: 'form-fields-deployment-version' })

  const { value: application } = useField('application')
  const { value: firewall } = useField('firewall')
  const { value: customPage } = useField('custom_page')

  const { value: rolloutMode } = useField('rollout_mode')
  const { value: gradualEnabled } = useField('gradual_rollout_enabled')
  const { value: gradualCandidatePercentage } = useField('gradual_rollout_candidate_percentage')
  const { value: gradualCandidateCookieName } = useField('gradual_rollout_candidate_cookie_name')
  const { value: gradualCandidateCookieMaxAge } = useField(
    'gradual_rollout_candidate_cookie_max_age_seconds'
  )
  const { value: gradualCandidateFromVersion } = useField(
    'gradual_rollout_candidate_from_deployment_version_id'
  )

  const { value: skewEnabled } = useField('skew_protection_enabled')
  const { value: skewCookieName } = useField('skew_protection_cookie_name')
  const { value: skewMaxAge } = useField('skew_protection_max_age_seconds')
  const { value: skewMaxSkewed } = useField('skew_protection_max_skewed_deployments')

  const { value: originType } = useField('origin_type')
  const { value: originSourceEnvironmentId } = useField('origin_source_environment_id')
  const { value: originSourceDeploymentVersionId } = useField('origin_source_deployment_version_id')
  const { value: originPromotedFrom } = useField('origin_promoted_from')
</script>

<template>
  <section class="flex flex-col gap-6">
    <header class="flex flex-col gap-1">
      <h3 class="text-base font-medium m-0">Resources</h3>
      <p class="text-xs text-color-secondary m-0">
        Pick the resources that will be pinned to this deployment version.
      </p>
    </header>

    <FieldDropdownLazyLoader
      required
      label="Application"
      name="application"
      inputId="application"
      optionLabel="name"
      optionValue="id"
      :service="edgeAppService.listEdgeApplicationsServiceDropdown"
      :loadService="edgeAppService.loadEdgeApplicationService"
      :value="application"
      placeholder="Select an Edge Application"
      data-testid="deployment-version-form__application-field"
    />

    <FieldDropdownLazyLoader
      label="Firewall"
      name="firewall"
      inputId="firewall"
      optionLabel="name"
      optionValue="id"
      :service="edgeFirewallService.listEdgeFirewallServiceDropdown"
      :loadService="edgeFirewallService.loadEdgeFirewallService"
      :value="firewall"
      placeholder="Select an Edge Firewall (optional)"
      data-testid="deployment-version-form__firewall-field"
    />

    <FieldDropdownLazyLoader
      label="Custom Page"
      name="custom_page"
      inputId="custom_page"
      optionLabel="name"
      optionValue="id"
      :service="customPageService.listCustomPagesService"
      :loadService="customPageService.loadCustomPagesService"
      :value="customPage"
      placeholder="Select a Custom Page (optional)"
      data-testid="deployment-version-form__custom-page-field"
    />
  </section>

  <Accordion
    :multiple="true"
    class="deployment-version-form__advanced"
    data-testid="deployment-version-form__advanced"
  >
    <AccordionTab header="Advanced — Strategy">
      <div class="flex flex-col gap-6 pt-2">
        <FieldDropdown
          label="Rollout Mode"
          name="rollout_mode"
          inputId="rollout_mode"
          :options="ROLLOUT_MODE_OPTIONS"
          optionLabel="label"
          optionValue="value"
          :value="rolloutMode"
          appendTo="self"
          placeholder="Select a rollout mode (optional)"
          description="How the version reaches traffic. TODO: confirm allowed values with backend."
          data-testid="deployment-version-form__rollout-mode-field"
        />

        <div class="flex flex-col gap-3">
          <FieldSwitchBlock
            nameField="gradual_rollout_enabled"
            name="gradual_rollout_enabled"
            :value="gradualEnabled"
            auto
            :isCard="false"
            title="Gradual Rollout"
            description="Send a percentage of traffic to this candidate version before promoting it."
            data-testid="deployment-version-form__gradual-enabled-field"
          />

          <div
            v-if="gradualEnabled"
            class="flex flex-col gap-4 pl-1"
          >
            <FieldNumber
              label="Candidate Percentage"
              name="gradual_rollout_candidate_percentage"
              :min="0"
              :max="100"
              :value="gradualCandidatePercentage"
              :useGrouping="false"
              suffix="%"
              placeholder="10"
              description="Share of traffic routed to the candidate (0–100)."
              data-testid="deployment-version-form__gradual-percentage-field"
            />
            <FieldText
              label="Candidate Cookie Name"
              name="gradual_rollout_candidate_cookie_name"
              :value="gradualCandidateCookieName"
              placeholder="azion_candidate"
              data-testid="deployment-version-form__gradual-cookie-name-field"
            />
            <FieldNumber
              label="Candidate Cookie Max Age (seconds)"
              name="gradual_rollout_candidate_cookie_max_age_seconds"
              :min="0"
              :value="gradualCandidateCookieMaxAge"
              :useGrouping="false"
              suffix=" s"
              placeholder="3600"
              data-testid="deployment-version-form__gradual-cookie-max-age-field"
            />
            <FieldText
              label="Candidate From Version Id"
              name="gradual_rollout_candidate_from_deployment_version_id"
              :value="gradualCandidateFromVersion"
              placeholder="version id (optional)"
              description="TODO: replace with version picker once a dedicated endpoint is exposed."
              data-testid="deployment-version-form__gradual-from-version-field"
            />
          </div>
        </div>

        <div class="flex flex-col gap-3">
          <FieldSwitchBlock
            nameField="skew_protection_enabled"
            name="skew_protection_enabled"
            :value="skewEnabled"
            auto
            :isCard="false"
            title="Skew Protection"
            description="Keep the previous version reachable after this one is promoted."
            data-testid="deployment-version-form__skew-enabled-field"
          />

          <div
            v-if="skewEnabled"
            class="flex flex-col gap-4 pl-1"
          >
            <FieldText
              label="Cookie Name"
              name="skew_protection_cookie_name"
              :value="skewCookieName"
              placeholder="azion_skew"
              data-testid="deployment-version-form__skew-cookie-name-field"
            />
            <FieldNumber
              label="Max Age (seconds)"
              name="skew_protection_max_age_seconds"
              :min="0"
              :value="skewMaxAge"
              :useGrouping="false"
              suffix=" s"
              placeholder="3600"
              data-testid="deployment-version-form__skew-max-age-field"
            />
            <FieldNumber
              label="Max Skewed Deployments"
              name="skew_protection_max_skewed_deployments"
              :min="0"
              :value="skewMaxSkewed"
              :useGrouping="false"
              placeholder="3"
              data-testid="deployment-version-form__skew-max-skewed-field"
            />
          </div>
        </div>
      </div>
    </AccordionTab>

    <AccordionTab header="Advanced — Origin">
      <div class="flex flex-col gap-4 pt-2">
        <FieldText
          label="Type"
          name="origin_type"
          :value="originType"
          placeholder="TODO: backend-defined origin type"
          description="TODO: confirm valid origin types with backend."
          data-testid="deployment-version-form__origin-type-field"
        />
        <FieldText
          label="Source Environment Id"
          name="origin_source_environment_id"
          :value="originSourceEnvironmentId"
          placeholder="environment id"
          data-testid="deployment-version-form__origin-source-environment-id-field"
        />
        <FieldText
          label="Source Deployment Version Id"
          name="origin_source_deployment_version_id"
          :value="originSourceDeploymentVersionId"
          placeholder="version id"
          data-testid="deployment-version-form__origin-source-version-id-field"
        />
        <FieldText
          label="Promoted From"
          name="origin_promoted_from"
          :value="originPromotedFrom"
          placeholder="deployment version id"
          data-testid="deployment-version-form__origin-promoted-from-field"
        />
      </div>
    </AccordionTab>
  </Accordion>
</template>

<style scoped>
  .deployment-version-form__advanced {
    margin-top: 0.5rem;
  }
</style>
