<script setup>
  // Firewall VersionShell form child. Specializes the shared adapter with its
  // service + schema; the default save strategy (save / save+build) applies.
  import * as yup from 'yup'
  import { useVersionFormAdapter } from '@/composables/versioning/use-version-form-adapter'
  import { edgeFirewallVersionService } from '@/services/v2/edge-firewall/edge-firewall-version-service'

  defineOptions({ name: 'firewall-version-adapter' })

  const props = defineProps({
    resource: { type: Object, required: true },
    resourceId: { type: [String, Number], required: true },
    versionId: { type: String, required: true }
  })

  useVersionFormAdapter({
    resource: () => props.resource,
    resourceId: () => props.resourceId,
    versionId: () => props.versionId,
    versionService: edgeFirewallVersionService,
    validationSchema: yup.object({
      name: yup.string().required().label('Name'),
      edgeFunctionsEnabled: yup.boolean().label('Functions'),
      networkProtectionEnabled: yup.boolean().label('Network Shield'),
      wafEnabled: yup.boolean().label('WAF'),
      isActive: yup.boolean().label('Active')
    })
  })
</script>

<template>
  <slot />
</template>
