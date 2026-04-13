# Plan: Remove Div Wrappers from FieldText Components

## Objective
Remove unnecessary `div` wrappers around `FieldText` components from `@aziontech/webkit/field-text` in `src/templates` and `src/views` directories.

## Transformation Rule

### Before
```vue
<div class="flex flex-col sm:max-w-lg w-full gap-2">
  <FieldText
    label="Name"
    required
    description="Give a unique and descriptive name to identify the custom template."
    name="name"
    :value="name"
    placeholder="My custom template"
    data-testid="data-stream-form__template__name-field"
  />
</div>
```

### After
```vue
<FieldText
  label="Name"
  required
  description="Give a unique and descriptive name to identify the custom template."
  name="name"
  :value="name"
  placeholder="My custom template"
  data-testid="data-stream-form__template__name-field"
/>
```

## Scope
Only remove div wrappers that contain **ONLY** a `FieldText` component (no other elements, labels, or components inside).

## Files to Analyze

### src/templates Directory

| File | Line | Pattern | Needs Modification |
|------|------|---------|-------------------|
| [`dialog-copy-key/index.vue`](src/templates/dialog-copy-key/index.vue) | 11-17 | `<div class="flex flex-col w-full gap-2">` wrapping FieldText | Yes |
| [`add-payment-method-block/add-address.vue`](src/templates/add-payment-method-block/add-address.vue) | 12-20 | `<div class="flex flex-col w-full gap-2 sm:max-w-lg">` wrapping FieldText | Yes |
| [`add-payment-method-block/add-address.vue`](src/templates/add-payment-method-block/add-address.vue) | 84-92 | `<div class="flex flex-col w-full gap-2 sm:max-w-lg">` wrapping FieldText | Yes |
| [`add-payment-method-block/add-address.vue`](src/templates/add-payment-method-block/add-address.vue) | 95-103 | `<div class="flex flex-col w-full gap-2 sm:max-w-lg">` wrapping FieldText | Yes |
| [`clone-block/index.vue`](src/templates/clone-block/index.vue) | 14 | FieldText without div wrapper | No - already clean |

### src/views Directory - Files with Div Wrapped FieldText

| File | Line | Div Class Pattern | Needs Modification |
|------|------|-------------------|-------------------|
| [`Credentials/FormFields/FormFieldsCredential.vue`](src/views/Credentials/FormFields/FormFieldsCredential.vue) | 165-174 | `flex flex-col sm:max-w-lg w-full gap-2` | Yes |
| [`EdgeFirewall/FormFields/FormFieldsEdgeFirewall.vue`](src/views/EdgeFirewall/FormFields/FormFieldsEdgeFirewall.vue) | 51-61 | `flex flex-col sm:max-w-lg w-full gap-2` | Yes |
| [`WafRules/FormFields/FormFieldsWafRules.vue`](src/views/WafRules/FormFields/FormFieldsWafRules.vue) | 117-127 | `flex flex-col sm:max-w-lg w-full gap-2` | Yes |
| [`EdgeApplicationsDeviceGroups/FormFields/FormFieldsEdgeApplicationsDeviceGroups.vue`](src/views/EdgeApplicationsDeviceGroups/FormFields/FormFieldsEdgeApplicationsDeviceGroups.vue) | 18-27 | `flex flex-col sm:max-w-lg w-full gap-2` | Yes |
| [`EdgeApplicationsFunctions/FormFields/FormFieldsEdgeApplicationsFunctions.vue`](src/views/EdgeApplicationsFunctions/FormFields/FormFieldsEdgeApplicationsFunctions.vue) | 215-225 | `flex flex-col sm:max-w-lg w-full gap-2` | Yes |
| [`EdgeConnectors/FormFields/blocks/General.vue`](src/views/EdgeConnectors/FormFields/blocks/General.vue) | 11-21 | `flex flex-col sm:max-w-lg w-full gap-2` | Yes |
| [`EdgeSQL/FormFields/FormFieldsCreateDatabase.vue`](src/views/EdgeSQL/FormFields/FormFieldsCreateDatabase.vue) | 9-18 | `flex flex-col sm:max-w-lg w-full gap-2` | Yes |
| [`EdgeSQL/FormFields/FormFieldsMainSettings.vue`](src/views/EdgeSQL/FormFields/FormFieldsMainSettings.vue) | 9-18 | `flex flex-col sm:max-w-lg w-full gap-2` | Yes |
| [`TeamsPermissions/FormFields/FormFieldsTeamPermissions.vue`](src/views/TeamsPermissions/FormFields/FormFieldsTeamPermissions.vue) | 70-80 | `flex flex-col sm:max-w-lg w-full gap-2` | Yes |
| [`EdgeApplications/FormFields/block/generalEdgeApp.vue`](src/views/EdgeApplications/FormFields/block/generalEdgeApp.vue) | 9-19 | `flex flex-col sm:max-w-lg w-full gap-2` | Yes |
| [`RealTimeEvents/FormFields/FormFieldsCreateEdgeApplications.vue`](src/views/RealTimeEvents/FormFields/FormFieldsCreateEdgeApplications.vue) | 119-129 | `flex flex-col sm:max-w-lg w-full gap-2` | Yes |
| [`PersonalTokens/FormFields/FormFieldsPersonalToken.vue`](src/views/PersonalTokens/FormFields/FormFieldsPersonalToken.vue) | 121-130 | `flex flex-col sm:max-w-lg w-full gap-2` | Yes |
| [`DigitalCertificates/FormFields/blocks/General.vue`](src/views/DigitalCertificates/FormFields/blocks/General.vue) | 8-17 | `flex flex-col sm:max-w-lg w-full gap-2` | Yes |
| [`DigitalCertificates/FormFields/blocks/RequestCertificate.vue`](src/views/DigitalCertificates/FormFields/blocks/RequestCertificate.vue) | 8-17, 18-27, 28-37, 38-47, 48-57, 58-67, 68-77 | `flex flex-col sm:max-w-lg w-full gap-2` | Yes - 7 instances |
| [`DigitalCertificates/FormFields/FormFieldsEditDigitalCertificates.vue`](src/views/DigitalCertificates/FormFields/FormFieldsEditDigitalCertificates.vue) | Multiple lines | `flex flex-col sm:max-w-lg w-full gap-2` | Yes - 5 instances |
| [`EdgeApplicationsCacheSettings/FormFields/FormFieldsEdgeApplicationCacheSettings.vue`](src/views/EdgeApplicationsCacheSettings/FormFields/FormFieldsEdgeApplicationCacheSettings.vue) | 8-18 | `flex flex-col sm:max-w-lg w-full gap-2` | Yes |
| [`Domains/FormFields/FormFieldsCreateDomains.vue`](src/views/Domains/FormFields/FormFieldsCreateDomains.vue) | 184-194 | `flex flex-col sm:max-w-lg w-full gap-2` | Yes |
| [`Domains/FormFields/FormFieldsEditDomains.vue`](src/views/Domains/FormFields/FormFieldsEditDomains.vue) | 204-214 | `flex flex-col sm:max-w-lg w-full gap-2` | Yes |
| [`EdgeDNS/FormFields/FormFieldsEdgeDns.vue`](src/views/EdgeDNS/FormFields/FormFieldsEdgeDns.vue) | 37-47, 54-64 | `flex flex-col sm:max-w-lg w-full gap-2` | Yes - 2 instances |
| [`EdgeDNS/FormFields/FormFieldsEditEdgeDns.vue`](src/views/EdgeDNS/FormFields/FormFieldsEditEdgeDns.vue) | 64-74 | `flex flex-col sm:max-w-lg w-full gap-2` | Yes |
| [`NetworkLists/FormFields/FormFieldsCreateNetworkLists.vue`](src/views/NetworkLists/FormFields/FormFieldsCreateNetworkLists.vue) | 73-83 | `flex flex-col sm:max-w-lg w-full gap-2` | Yes |
| [`NetworkLists/FormFields/FormFieldsEditNetworkLists.vue`](src/views/NetworkLists/FormFields/FormFieldsEditNetworkLists.vue) | 62-72 | `flex flex-col sm:max-w-lg w-full gap-2` | Yes |
| [`EdgeFirewallFunctions/FormFields/FormFieldsEdgeApplicationsFunctions.vue`](src/views/EdgeFirewallFunctions/FormFields/FormFieldsEdgeApplicationsFunctions.vue) | 214-224 | `flex flex-col sm:max-w-lg w-full gap-2` | Yes |
| [`EdgeNode/FormFields/FormFieldsEdgeNode.vue`](src/views/EdgeNode/FormFields/FormFieldsEdgeNode.vue) | 48-58, 65-75 | `flex flex-col sm:max-w-lg w-full gap-2` | Yes - 2 instances |
| [`EdgeServices/FormFields/FormFieldsDrawerResource.vue`](src/views/EdgeServices/FormFields/FormFieldsDrawerResource.vue) | 79-89 | `flex flex-col sm:max-w-lg w-full gap-2` | Yes |
| [`EdgeServices/FormFields/FormFieldsEdgeService.vue`](src/views/EdgeServices/FormFields/FormFieldsEdgeService.vue) | 44-54 | `flex flex-col sm:max-w-lg w-full gap-2` | Yes |
| [`EdgeApplicationsRulesEngine/FormFields/FormFieldsEdgeApplicationsRulesEngine.vue`](src/views/EdgeApplicationsRulesEngine/FormFields/FormFieldsEdgeApplicationsRulesEngine.vue) | 598-608 | `flex flex-col sm:max-w-lg w-full gap-2` | Yes |
| [`EdgeFirewallRulesEngine/FormFields/FormFieldsEdgeFirewallRulesEngine.vue`](src/views/EdgeFirewallRulesEngine/FormFields/FormFieldsEdgeFirewallRulesEngine.vue) | 527-537, 538-548 | `flex flex-col sm:max-w-lg w-full gap-2` | Yes - 2 instances |
| [`EdgeApplicationsOrigins/FormFields/FormFieldsEdgeApplicationsOrigins.vue`](src/views/EdgeApplicationsOrigins/FormFields/FormFieldsEdgeApplicationsOrigins.vue) | 169-179 | `flex flex-col sm:max-w-lg w-full gap-2` | Yes |
| [`CustomPages/Blocks/customPageBlock.vue`](src/views/CustomPages/Blocks/customPageBlock.vue) | 8-18 | `flex flex-col sm:max-w-lg w-full gap-2` | Yes |
| [`EdgeStorage/FormFields/FormFieldsCredential.vue`](src/views/EdgeStorage/FormFields/FormFieldsCredential.vue) | 55-65 | `flex flex-col sm:max-w-lg w-full gap-2` | Yes |
| [`EdgeStorage/FormFields/FormFieldsEdgeStorage.vue`](src/views/EdgeStorage/FormFields/FormFieldsEdgeStorage.vue) | 42-52 | `flex flex-col sm:max-w-lg w-full gap-2` | Yes |
| [`Variables/FormFields/FormFieldsVariables.vue`](src/views/Variables/FormFields/FormFieldsVariables.vue) | 20-30, 34-44 | `flex flex-col sm:max-w-lg w-full gap-2` | Yes - 2 instances |
| [`EdgeFunctions/FormFields/FormFieldsCreateEdgeFunctions.vue`](src/views/EdgeFunctions/FormFields/FormFieldsCreateEdgeFunctions.vue) | 210-220 | `flex flex-col sm:max-w-lg w-full gap-2` | Yes |
| [`EdgeFunctions/FormFields/FormFieldsEditEdgeFunctions.vue`](src/views/EdgeFunctions/FormFields/FormFieldsEditEdgeFunctions.vue) | 226-236 | `flex flex-col sm:max-w-lg w-full gap-2` | Yes |
| [`Workload/FormFields/FormFieldsCreateDomains.vue`](src/views/Workload/FormFields/FormFieldsCreateDomains.vue) | 241-251 | `flex flex-col sm:max-w-lg w-full gap-2` | Yes |
| [`Workload/FormFields/FormFieldsEditDomains.vue`](src/views/Workload/FormFields/FormFieldsEditDomains.vue) | 209-219 | `flex flex-col sm:max-w-lg w-full gap-2` | Yes |
| [`Workload/FormFields/blocks/generalBlock.vue`](src/views/Workload/FormFields/blocks/generalBlock.vue) | 27-37 | `flex flex-col sm:max-w-lg w-full gap-2` | Yes |
| [`Users/FormsFields/FormFieldsUsers.vue`](src/views/Users/FormsFields/FormFieldsUsers.vue) | 205-215, 216-226, 279-289 | `flex flex-col sm:max-w-lg w-full gap-2` | Yes - 3 instances |

### src/views Directory - Files with Complex Div Patterns (Multiple Components)

| File | Notes |
|------|-------|
| [`IdentityProviders/FormFields/FormFieldsCreateIdentityProvider.vue`](src/views/IdentityProviders/FormFields/FormFieldsCreateIdentityProvider.vue) | Multiple FieldText wrapped in divs - needs careful review |
| [`ImportGitHub/FormFields/FormFieldsImportGithub.vue`](src/views/ImportGitHub/FormFields/FormFieldsImportGithub.vue) | Multiple FieldText wrapped in divs - needs careful review |
| [`DataStream/FormFields/blocks/OutputSection.vue`](src/views/DataStream/FormFields/blocks/OutputSection.vue) | Multiple FieldText wrapped in divs - needs careful review |
| [`EdgeConnectors/FormFields/blocks/ConnectionOptions.vue`](src/views/EdgeConnectors/FormFields/blocks/ConnectionOptions.vue) | Multiple FieldText wrapped in divs - needs careful review |
| [`EdgeApplications/V3/FormFields/FormFieldsCreateEdgeApplications.vue`](src/views/EdgeApplications/V3/FormFields/FormFieldsCreateEdgeApplications.vue) | Multiple FieldText wrapped in divs - needs careful review |
| [`EdgeApplicationsOrigins/FormFields/FormFieldsEdgeApplicationsOrigins.vue`](src/views/EdgeApplicationsOrigins/FormFields/FormFieldsEdgeApplicationsOrigins.vue) | Multiple FieldText wrapped in divs - needs careful review |
| [`AccountSettings/FormFields/FormFieldsAccountSettings.vue`](src/views/AccountSettings/FormFields/FormFieldsAccountSettings.vue) | Multiple FieldText wrapped in divs - needs careful review |
| [`ResellersManagement/FormFields/FormFieldsCreateResellers.vue`](src/views/ResellersManagement/FormFields/FormFieldsCreateResellers.vue) | Multiple FieldText wrapped in divs - needs careful review |
| [`ClientsManagement/FormFields/FormFieldsCreateClients.vue`](src/views/ClientsManagement/FormFields/FormFieldsCreateClients.vue) | Multiple FieldText wrapped in divs - needs careful review |
| [`GroupsManagement/FormFields/FormFieldsCreateGroups.vue`](src/views/GroupsManagement/FormFields/FormFieldsCreateGroups.vue) | Multiple FieldText wrapped in divs - needs careful review |

### src/views Directory - Files Already Clean (FieldText without div wrapper)

| File | Notes |
|------|-------|
| [`DataStream/FormFields/FormFieldsTemplate.vue`](src/views/DataStream/FormFields/FormFieldsTemplate.vue) | FieldText without wrapper div - already clean |
| [`YourSettings/FormFields/FormFieldsYourSettings.vue`](src/views/YourSettings/FormFields/FormFieldsYourSettings.vue) | FieldText without wrapper div - already clean |

## Estimated Total Files to Modify

- **src/templates**: ~4 modifications across 2 files
- **src/views**: ~70+ modifications across ~40 files

## Implementation Strategy

1. Search for pattern: `<div class="flex flex-col[^>]*gap-2"[^>]*>` followed by newline and `<FieldText`
2. Verify the div contains ONLY the FieldText component (no other elements)
3. Remove the opening div tag
4. Remove the closing `</div>` tag
5. Adjust indentation if needed

## Regex Pattern for Finding
    
```regex
<div class="flex flex-col[^>]*gap-2"[^>]*>\s*<FieldText[\s\S]*?/>\s*</div>
```

## Important Notes

1. **Do NOT modify** divs that contain other elements besides FieldText
2. **Do NOT modify** the FieldText component props or attributes
3. **Preserve** all data-testid, :value bindings, and other attributes
4. **Maintain** proper indentation after removal

## Questions for User

1. Should we proceed with this plan?
2. Are there any specific files you want to exclude?
3. Should we also handle similar patterns with other Field components (FieldTextArea, FieldDropdown, etc.)?
