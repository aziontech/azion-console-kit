# Edge Functions - Test Specification Catalog

**Module:** Edge Functions
**Path:** `/functions`
**Last Updated:** 2024-12-20

---

## 1. Architecture Overview

### 1.1 Component Hierarchy

```
EdgeFunctions/
├── ListView.vue                    # List all functions with filtering/sorting
├── CreateView.vue                  # Full-page create form
├── EditView.vue                    # Full-page edit form
├── Drawer/index.vue                # Drawer for creating (used in Firewall)
├── FormFields/
│   ├── FormFieldsCreateEdgeFunctions.vue   # Create form fields
│   ├── FormFieldsEditEdgeFunctions.vue     # Edit form fields
│   └── Config/index.js                      # Default form builder schema
└── components/
    ├── code-editor.vue             # Monaco editor wrapper
    ├── code-preview.vue            # iframe-based preview
    └── mobile-code-preview.vue     # Mobile sidebar preview
```

### 1.2 Templates Used

| Template | Purpose | Used In |
|----------|---------|---------|
| `FetchListTableBlock` | List with pagination, sorting, filtering | ListView |
| `CreateFormBlock` | Form wrapper with validation | CreateView |
| `EditFormBlock` | Form wrapper with load/save | EditView |
| `CreateDrawerBlock` | Drawer form wrapper | Drawer |
| `ActionBarBlockWithTeleport` | Submit/Cancel buttons | Create/Edit Views |
| `FormHorizontal` | Horizontal form layout | Form Fields |
| `ResizableSplitter` | Code editor + preview layout | Form Fields |
| `TabView/TabPanel` | Multi-tab interface | Edit Form Fields |

### 1.3 Caching & Data Fetching

- **TanStack Vue Query**: Used for API caching
- **Cache Type**: `CACHE_TYPE.GLOBAL` for list operations
- **Lazy Loading**: All views use dynamic imports `() => import('@views/EdgeFunctions/...')`
- **Skeleton Loading**: Shows skeleton while data loads

---

## 2. API Endpoints

### 2.1 Base URL
```
/v4/workspace/functions
```

### 2.2 Service Methods

| Method | HTTP | Endpoint | Description |
|--------|------|----------|-------------|
| `listEdgeFunctionsService` | GET | `/v4/workspace/functions` | List with pagination |
| `loadEdgeFunctionService` | GET | `/v4/workspace/functions/{id}` | Load single |
| `createEdgeFunctionsService` | POST | `/v4/workspace/functions` | Create new |
| `editEdgeFunctionService` | PATCH | `/v4/workspace/functions/{id}` | Update |
| `deleteEdgeFunctionService` | DELETE | `/v4/workspace/functions/{id}` | Delete |

### 2.3 Request/Response Transformations

**Payload Transform (Create/Edit):**
```javascript
{
  name: payload.name,
  code: payload.code,
  active: payload.active,
  default_args: JSON.parse(payload.defaultArgs),
  runtime: payload.runtime === 'javascript' ? 'azion_js' : 'azion_lua',
  execution_environment: payload.executionEnvironment,
  azion_form: payload.azionForm
}
```

**Response Transform (Load/List):**
```javascript
{
  id: value.id,
  name: value.name,
  code: value.code,
  active: value.active,
  runtime: { content: 'JavaScript', format: 'javascript', icon: 'javascript' },
  executionEnvironment: value.execution_environment,
  defaultArgs: JSON.stringify(value.default_args, null, 2),
  azionForm: JSON.stringify(value.azion_form, null, 2),
  status: { content: 'Active', severity: 'success' }
}
```

---

## 3. Toast Messages

| Action | Message | Type |
|--------|---------|------|
| Create Success | `"Your function has been created"` | success |
| Edit Success | `"Your Function has been updated"` | success |
| Delete Success | `"Function successfully deleted"` | success |

**Note:** Create toast includes action link "View Function" that redirects to edit page.

---

## 4. Validation Rules

### 4.1 Form Validation (Yup Schema)

```javascript
{
  name: yup.string().required('Name is a required field'),
  code: yup.string().required('Code is a required field'),
  defaultArgs: yup.string().test('validJson', 'Invalid JSON', (value) => {
    try { JSON.parse(value); return true; } catch { return false; }
  }),
  executionEnvironment: yup.string().required().label('Initiator Type'),
  active: yup.boolean(),
  runtime: yup.string()
}
```

### 4.2 Form Builder Schema Validation

Uses `isValidFormBuilderSchema` utility for JSON Forms schema validation.

---

## 5. Data-TestIDs Catalog

### 5.1 List View

| Element | data-testid | Description |
|---------|-------------|-------------|
| Container | `data-table-container` | Main table container |
| Table | `data-table` | DataTable component |
| Search Input | `data-table-search-input` | Filter input |
| Create Button | `create_Function_button` | "+ Function" button |
| Name Column | `list-table-block__column__name__row` | Name cell |
| ID Column | `list-table-block__column__id__row` | ID cell |
| Version Column | `list-table-block__column__version__row` | Version cell |
| Ref Count Column | `list-table-block__column__referenceCount__row` | Reference count cell |
| Vendor Column | `list-table-block__column__vendor__row` | Vendor cell |
| Runtime Column | `list-table-block__column__runtime__row` | Runtime/Language cell |
| Exec Env Column | `list-table-block__column__executionEnvironment__row` | Initiator type cell |
| Last Editor Column | `list-table-block__column__lastEditor__row` | Last editor cell |
| Last Modified Column | `list-table-block__column__lastModify__row` | Last modified cell |
| Status Column | `list-table-block__column__status__row` | Status tag cell |
| Actions Menu | `data-table-actions-column-body-actions-menu` | Row actions menu |
| Delete Action | `data-table__actions-menu-item__delete-button` | Delete menu item |
| Empty State | `list-table-block__empty-message__text` | Empty list message |
| Skeleton | `data-table-skeleton` | Loading skeleton |

### 5.2 Create/Edit Form

| Element | data-testid | Description |
|---------|-------------|-------------|
| Name Input | `field-text__input` | Name text field |
| Name Label | `field-text__label` | Name field label |
| Name Error | `field-text__error` | Name validation error |
| Submit Button | `form-actions-submit-button` | Save button |
| Cancel Button | `form-actions-cancel-button` | Cancel button |
| Radio Group | `field-radio__label` | Execution environment label |
| Radio Option | `field-radio__${name}__${nameField}__${index}__input` | Radio button |
| Switch | `field-switch__switch` | Active toggle |
| Switch Label | `field-switch__label` | Switch label |

### 5.3 Delete Dialog

| Element | data-testid | Description |
|---------|-------------|-------------|
| Dialog | `delete-dialog` | Delete confirmation dialog |
| Content | `delete-dialog-content` | Dialog content |
| Warning Message | `delete-dialog-warning-message` | Warning text |
| Confirmation Input | `delete-dialog-confirmation-input` | Type name input |
| Confirm Button | `delete-dialog-footer__confirm-button` | Confirm delete |
| Cancel Button | `delete-dialog-footer__cancel-button` | Cancel delete |

---

## 6. Routes & Navigation

### 6.1 Route Configuration

| Path | Name | Component | Props |
|------|------|-----------|-------|
| `/functions` | `list-functions` | ListView | - |
| `/functions/create` | `create-functions` | CreateView | - |
| `/functions/edit/:id` | `edit-functions` | EditView | `updatedRedirect: 'list-functions'` |

### 6.2 Navigation Flows

```
ListView ──[+ Function]──> CreateView
    │                           │
    │                           └──[Save]──> EditView (redirects to edit)
    │                           └──[Cancel]──> ListView
    │
    └──[Click Row]──> EditView
                           │
                           └──[Save]──> ListView
                           └──[Cancel]──> ListView
```

### 6.3 URL Query Params

- Create: `/functions/create?origin=list` (from list button)
- Create: `/functions/create?origin=drawer` (from drawer)

---

## 7. Test Scenarios

### 7.1 List View Tests

| ID | Scenario | Priority | Pre-conditions |
|----|----------|----------|----------------|
| L01 | Display list of functions with correct columns | High | At least 1 function exists |
| L02 | Show empty state when no functions | Medium | No functions exist |
| L03 | Filter functions by name | High | Multiple functions exist |
| L04 | Sort functions by column | Medium | Multiple functions exist |
| L05 | Navigate to create page | High | - |
| L06 | Navigate to edit page (row click) | High | At least 1 function exists |
| L07 | Delete function from list | High | At least 1 function exists |
| L08 | Show loading skeleton | Low | - |
| L09 | Paginate through results | Medium | More than 10 functions |
| L10 | Toggle column visibility | Low | - |

### 7.2 Create View Tests

| ID | Scenario | Priority | Pre-conditions |
|----|----------|----------|----------------|
| C01 | Create function with default settings (Application) | High | - |
| C02 | Create function with Firewall execution environment | High | - |
| C03 | Validation error - empty name | High | - |
| C04 | Validation error - empty code | High | - |
| C05 | Validation error - invalid JSON args | Medium | - |
| C06 | Cancel creation returns to list | Medium | - |
| C07 | Show toast with "View Function" link on success | Medium | - |
| C08 | Redirect to edit page after creation | High | - |
| C09 | Code editor syntax highlighting | Low | - |
| C10 | Code preview updates in real-time | Low | - |
| C11 | Default code template is loaded | Medium | - |
| C12 | Switch between Main Settings/Code/Arguments tabs | Medium | - |

### 7.3 Edit View Tests

| ID | Scenario | Priority | Pre-conditions |
|----|----------|----------|----------------|
| E01 | Load existing function data | High | Function exists |
| E02 | Edit function name | High | Function exists |
| E03 | Edit function code | High | Function exists |
| E04 | Edit execution environment | Medium | Function exists |
| E05 | Edit default arguments | Medium | Function exists |
| E06 | Toggle active status | Medium | Function exists |
| E07 | Validation error - clear name | High | Function exists |
| E08 | Show toast on successful update | High | Function exists |
| E09 | Redirect to list after save | High | Function exists |
| E10 | Cancel edit returns to list | Medium | Function exists |
| E11 | Preserve data on tab switch | Medium | Function exists |
| E12 | Read-only code for proprietary functions | Low | Proprietary function exists |
| E13 | Handle Lua runtime (no preview) | Low | Lua function exists |

### 7.4 Delete Tests

| ID | Scenario | Priority | Pre-conditions |
|----|----------|----------|----------------|
| D01 | Delete function successfully | High | Function exists |
| D02 | Type name to confirm deletion | High | Function exists |
| D03 | Cancel deletion | Medium | Function exists |
| D04 | Show toast on successful delete | High | Function exists |
| D05 | Function removed from list after delete | High | Function exists |

### 7.5 Form Builder Tests

| ID | Scenario | Priority | Pre-conditions |
|----|----------|----------|----------------|
| F01 | Initialize default form builder schema | Low | - |
| F02 | Validate form builder schema | Low | - |
| F03 | Render form from schema | Low | - |
| F04 | Update args from form changes | Low | - |
| F05 | Remove/reset form builder | Low | - |
| F06 | Handle invalid schema JSON | Low | - |

### 7.6 API Integration Tests

| ID | Scenario | Priority | HTTP Method |
|----|----------|----------|-------------|
| A01 | Create function - 201 success | High | POST |
| A02 | Create function - 400 validation error | Medium | POST |
| A03 | Update function - 200 success | High | PATCH |
| A04 | Update function - 404 not found | Medium | PATCH |
| A05 | Delete function - 204 success | High | DELETE |
| A06 | List functions - 200 success | High | GET |
| A07 | Load function - 200 success | High | GET |
| A08 | Handle 500 server error | Medium | Any |

---

## 8. Selectors File Update

The current selectors file needs updates. Here's the recommended structure:

```javascript
// cypress/support/selectors/product-selectors/edge-functions.js
export default {
  // List View
  list: {
    container: '[data-testid="data-table-container"]',
    table: '[data-testid="data-table"]',
    searchInput: '[data-testid="data-table-search-input"]',
    createButton: '[data-testid="create_Function_button"]',
    skeleton: '[data-testid="data-table-skeleton"]',
    emptyMessage: '[data-testid="list-table-block__empty-message__text"]',
    actionsMenu: '[data-testid="data-table-actions-column-body-actions-menu"]',
    deleteAction: '[data-testid="data-table__actions-menu-item__delete-button"]',
    actionsMenuButton: '[data-testid="data-table-actions-column-body-actions-menu-button"]',
    // Columns
    columns: {
      name: '[data-testid="list-table-block__column__name__row"]',
      id: '[data-testid="list-table-block__column__id__row"]',
      version: '[data-testid="list-table-block__column__version__row"]',
      referenceCount: '[data-testid="list-table-block__column__referenceCount__row"]',
      vendor: '[data-testid="list-table-block__column__vendor__row"]',
      runtime: '[data-testid="list-table-block__column__runtime__row"]',
      executionEnvironment: '[data-testid="list-table-block__column__executionEnvironment__row"]',
      lastEditor: '[data-testid="list-table-block__column__lastEditor__row"]',
      lastModified: '[data-testid="list-table-block__column__lastModify__row"]',
      status: '[data-testid="list-table-block__column__status__row"]'
    }
  },
  // Form
  form: {
    nameInput: '[data-testid="field-text__input"]',
    nameError: '[data-testid="field-text__error"]',
    submitButton: '[data-testid="form-actions-submit-button"]',
    cancelButton: '[data-testid="form-actions-cancel-button"]',
    activeSwitch: '[data-testid="field-switch__switch"]'
  },
  // Delete Dialog
  deleteDialog: {
    dialog: '[data-testid="delete-dialog"]',
    confirmInput: '[data-testid="delete-dialog-confirmation-input"]',
    confirmButton: '[data-testid="delete-dialog-footer__confirm-button"]',
    cancelButton: '[data-testid="delete-dialog-footer__cancel-button"]'
  }
}
```

---

## 9. Test Data Requirements

### 9.1 Fixtures

```javascript
{
  functionName: generateUniqueName('Function'),
  updatedName: generateUniqueName('FunctionEdited'),
  defaultCode: 'export default function main() { return "Hello"; }',
  defaultArgs: '{}',
  invalidJson: '{ invalid json }',
  executionEnvironments: {
    application: 'application',
    firewall: 'firewall'
  }
}
```

### 9.2 API Intercepts

```javascript
// List
cy.intercept('GET', '/v4/workspace/functions*').as('listFunctions')

// Create
cy.intercept('POST', '/v4/workspace/functions').as('createFunction')

// Load
cy.intercept('GET', '/v4/workspace/functions/*').as('loadFunction')

// Update
cy.intercept('PATCH', '/v4/workspace/functions/*').as('updateFunction')

// Delete
cy.intercept('DELETE', '/v4/workspace/functions/*').as('deleteFunction')
```

---

## 10. Known Issues & Considerations

### 10.1 Timing Issues

- List loads asynchronously - always wait for `@listFunctions`
- Skeleton shows during load - wait for skeleton to disappear or data to appear
- Toast appears briefly - use `cy.verifyToast` custom command
- Tab switching may have animation delay

### 10.2 Element Visibility

- Code editor requires Monaco to load
- Preview iframe needs time to initialize
- Form builder uses JSON Forms library - may need extra wait
- Mobile elements only visible at certain breakpoints

### 10.3 Navigation

- After create: redirects to edit page (NOT list)
- After edit save: redirects to list
- Cancel: returns to previous page (usually list)

### 10.4 Product Name Discrepancy

- UI shows "Functions" (addButtonLabel, pageTitle)
- Analytics tracking uses "Edge Functions" (productName)
- Routes use "functions" (path)
- Old selectors used "Edge Function" - INCORRECT

---

## 11. Test Execution Order Recommendation

1. **Smoke Tests** (run first)
   - L01: List displays correctly
   - C01: Create basic function
   - E01: Load existing function
   - D01: Delete function

2. **Functional Tests**
   - All Create scenarios (C01-C12)
   - All Edit scenarios (E01-E13)
   - All Delete scenarios (D01-D05)
   - All List scenarios (L01-L10)

3. **Edge Cases**
   - Validation errors
   - API errors
   - Form builder scenarios

---

## 12. Changelog

| Date | Author | Changes |
|------|--------|---------|
| 2024-12-20 | AI | Initial catalog creation |
