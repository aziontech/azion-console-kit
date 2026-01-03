# EdgeApplications Module - Specification Catalog

## 1. Architecture Overview

### Main Files & Component Structure

```
/src/views/EdgeApplications/
├── ListView.vue                          # List view for all applications
├── CreateView.vue                        # Create new application (v2/legacy)
├── EditView.vue                          # Edit application main settings (v2/legacy)
├── TabsView.vue                          # Tab-based edit view (orchestrates all tabs)
├── FormFields/
│   ├── FormFieldsCreateEdgeApplications.vue   # Create form fields (legacy)
│   ├── FormFieldsEditEdgeApplications.vue     # Edit form fields (legacy)
│   └── block/
│       ├── generalEdgeApp.vue            # Name input
│       ├── moduleEdgeApp.vue             # Module toggles
│       ├── statusEdgeApp.vue             # Active/Inactive toggle
│       └── debugEdgeApp.vue              # Debug rules toggle
├── V3/                                   # API v4 implementation
│   ├── CreateView.vue                    # Create view (v4)
│   ├── EditView.vue                      # Edit view (v4)
│   ├── FormFields/
│   │   └── FormFieldsCreateEdgeApplications.vue  # Full form with delivery settings
│   └── Drawer/
│       └── index.vue                     # Create in drawer
└── Drawer/
    └── index.vue                         # Create application drawer (v2)
```

---

## 2. API Endpoints

### Base URL
```
v4/workspace/applications
```

### Core Endpoints

| Operation | Method | Endpoint | Service Method |
|-----------|--------|----------|----------------|
| List Applications | GET | `v4/workspace/applications` | `listEdgeApplicationsService(params)` |
| Get Single App | GET | `v4/workspace/applications/{id}` | `loadEdgeApplicationService({id, params})` |
| Create Application | POST | `v4/workspace/applications` | `createEdgeApplicationService(payload)` |
| Update Application | PATCH | `v4/workspace/applications/{id}` | `editEdgeApplicationService(payload)` |
| Delete Application | DELETE | `v4/workspace/applications/{id}` | `deleteEdgeApplicationService(id)` |
| Clone Application | POST | `v4/workspace/applications/{id}/clone` | `cloneEdgeApplicationService(payload)` |

### Related Endpoints

- **Device Groups**: `v4/workspace/applications/{appId}/device_groups`
- **Error Responses**: `v4/workspace/applications/{appId}/error_responses`
- **Cache Settings**: `v4/workspace/applications/{appId}/cache_settings`
- **Rules Engine**: `v4/workspace/applications/{appId}/{phase}`
- **Functions**: `v4/workspace/applications/{appId}/functions`

---

## 3. Toast Messages

| Scenario | Message | Type |
|----------|---------|------|
| Application Created | "Your Application has been created" | feedback |
| Application Updated | "Your application has been updated" | success |
| Application Cloned | "Your Application has been cloned" | feedback |
| Application Deleted | "Resource successfully deleted" | success |
| Locked Application Access | "This instance is locked and cannot be modified..." | warn |

---

## 4. Validation Rules (Yup Schemas)

### CreateView.vue (v2)
```javascript
yup.object({
  name: yup.string().required()
})
```

### V3/CreateView.vue (v4)
```javascript
yup.object({
  name: yup.string().required(),
  address: yup.string().required(),
  hostHeader: yup.string().required(),
  cdnCacheSettingsMaximumTtl: yup.string().required(),
  httpPort: yup.array().when('deliveryProtocol', {
    is: (deliveryProtocol) => deliveryProtocol?.includes('http'),
    then: (schema) => schema.min(1).required()
  }),
  httpsPort: yup.array().when('deliveryProtocol', {
    is: (deliveryProtocol) => deliveryProtocol?.includes('https'),
    then: (schema) => schema.min(1).required()
  })
})
```

---

## 5. Data-TestIDs

### ListView
- `edge-applications-content-block`
- `edge-applications-heading`
- `edge-applications-list-table-block`

### CreateView
- `create-edge-application-content-block`
- `create-edge-application-heading`
- `create-edge-application-form-block`

### Form Sections
- `form-horizontal-general-name`
- `form-horizontal-modules-default-switch`
- `form-horizontal-active-switch`
- `form-horizontal-debug-rules-switch`

### Delivery Settings (v4)
- `form-horizontal-delivery-settings-protocol-usage`
- `form-horizontal-delivery-settings-http-ports-multi-select`
- `form-horizontal-delivery-settings-https-ports-multi-select`
- `form-horizontal-delivery-settings-tls-version-field-dropdown`

---

## 6. Routes & Navigation

| Page | Route | Tab Param |
|------|-------|-----------|
| List Applications | `/applications` | - |
| Create Application | `/applications/create` | - |
| Edit Application | `/applications/edit/:id` | - |
| Edit with Tab | `/applications/edit/:id/:tab` | main-settings, origins, device-groups, error-responses, cache-settings, functions, rules-engine |

---

## 7. Test Scenarios

### CREATE Operations

1. **Create Application (v2)** - Enter name, toggle modules, save
2. **Create Application (v4)** - Enter name, address, host header, ports, TTL
3. **Create from Drawer** - Open drawer, fill form, save

### READ Operations

4. **List Applications** - Verify columns, ordering, search
5. **Filter Applications** - Search by name
6. **View Application Details** - Load tabs, verify locked status
7. **Pagination** - Change page/size

### UPDATE Operations

8. **Edit Application (v2)** - Modify name, modules, status
9. **Edit Application (v4)** - Modify delivery settings
10. **Unsaved Changes Dialog** - Navigate with pending changes

### DELETE Operations

11. **Delete Application** - Confirm deletion, verify removed

### CLONE Operations

12. **Clone Application** - Enter new name, verify cloned

### FEATURE FLAGS

13. **API v4 Blocked Flag** - Verify component switching
14. **Module Visibility** - Verify tab visibility based on flags

### LOCKED APPLICATION

15. **Locked Badge Display** - Verify locked indicator
16. **Locked Edit Prevention** - Verify disabled fields

### VALIDATION

17. **Required Field Validation** - Empty name error
18. **Conditional Port Validation** - HTTP/HTTPS port requirements

### ANALYTICS

19. **Create Tracking** - productCreated event
20. **Edit Tracking** - productEdited event
21. **Failed Operation Tracking** - Error tracking
