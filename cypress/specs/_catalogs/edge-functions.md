# EdgeFunctions Module - Specification Catalog

## 1. Architecture Overview

```
EdgeFunctions/
├── ListView.vue                    # List all functions
├── CreateView.vue                  # Create new function
├── EditView.vue                    # Edit existing function
├── Drawer/index.vue                # Create drawer
├── FormFields/
│   ├── FormFieldsCreateEdgeFunctions.vue
│   ├── FormFieldsEditEdgeFunctions.vue
│   └── Config/index.js             # Form builder schema
└── components/
    ├── code-editor.vue             # Monaco editor wrapper
    ├── code-preview.vue            # Live preview
    └── mobile-code-preview.vue     # Mobile responsive preview
```

---

## 2. API Endpoints

### Base URL: `v4/workspace/functions`

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/` | List all edge functions |
| GET | `/{id}` | Load single function |
| POST | `/` | Create new function |
| PATCH | `/{id}` | Update function |
| DELETE | `/{id}` | Delete function |

---

## 3. Toast Messages

| Action | Message |
|--------|---------|
| Create | "Your function has been created" |
| Create (Drawer) | "Your Function has been created" |
| Update | "Your Function has been updated" |
| Delete | "Function successfully deleted" |

---

## 4. Validation Rules

### Create/Edit Schema
```javascript
yup.object({
  name: yup.string().required(),
  code: yup.string().required(),
  azionForm: yup.object(),
  defaultArgs: yup.string().test('validJson', 'Invalid JSON', validateJson),
  executionEnvironment: yup.string().required(),
  active: yup.boolean(),
  runtime: yup.string()
})
```

### Form Builder Schema (A/B Testing Template)
```javascript
{
  cookie_name: { type: 'string', minLength: 1 },
  domain: { type: 'string', pattern: '^[.]?[a-zA-Z0-9]...' },
  max_age: { type: 'integer', min: 1, max: 31536000 },
  path: { type: 'string', pattern: '^/' },
  values: {
    type: 'array',
    maxItems: 6,
    items: { value: { maxLength: 50 }, weight: { min: 1, max: 100 } }
  }
}
```

---

## 5. Data-TestIDs

| TestID | Purpose |
|--------|---------|
| `create_Function_button` | Create function button |
| `field-text__input` | Text input for name |
| `form-actions-submit-button` | Save button |
| `form-actions-cancel-button` | Cancel button |
| `data-table-search-input` | Search input |
| `list-table-block__column__name__row` | Name column |
| `list-table-block__column__language__row` | Runtime column |
| `list-table-block__column__initiatorType__row` | Execution env column |

---

## 6. Routes

| Path | Name | Component |
|------|------|-----------|
| `/functions` | `list-functions` | ListView.vue |
| `/functions/create` | `create-functions` | CreateView.vue |
| `/functions/edit/:id` | `edit-functions` | EditView.vue |

---

## 7. Test Scenarios

### CREATE Operations
1. **Create Basic Function** - Name + default HelloWorld code
2. **Create with Firewall Initiator** - Select firewall execution env
3. **Validation - Empty Name** - Required error
4. **Cancel Creation** - Return to list without saving

### READ Operations
5. **List Functions** - Columns: Name, ID, Version, Vendor, Runtime, Status
6. **Load Function Detail** - Verify all fields populated

### UPDATE Operations
7. **Edit Function Name** - Modify and save
8. **Edit Execution Environment** - Change application/firewall
9. **Validation on Edit** - Name required
10. **Cancel Edit** - Return without saving

### DELETE Operations
11. **Delete Function** - Confirm deletion
12. **Delete Multiple** - Delete sequentially

### Code Editor Tests
13. **JavaScript Syntax** - Monaco editor with JS highlighting
14. **Validate Code Required** - Error when empty

### Arguments Tests
15. **JSON Mode** - Enter/validate JSON arguments
16. **Form Builder Mode** - Toggle to form builder interface
17. **Invalid JSON** - Validation error

---

## Form Fields

### Main Settings Tab
- **Name**: Text input (required)
- **Runtime**: Locked display (JavaScript)
- **Execution Environment**: Radio (Application / Firewall)
- **Status**: Toggle (Active/Inactive)

### Code Tab
- **Code Editor**: Monaco editor (JavaScript)
- **Live Preview**: Real-time execution preview

### Arguments Tab
- **Default Args**: JSON editor
- **Azion Form**: Form Builder interface (optional)

---

## Initial Values

```javascript
{
  name: '',
  active: true,
  runtime: 'javascript',
  code: HelloWorldSample,
  args: '{}',
  azionForm: {},
  executionEnvironment: 'application'
}
```

---

## List Columns

| Column | Field | Sortable |
|--------|-------|----------|
| Name | name | Yes |
| ID | id | Yes |
| Version | version | No |
| Ref Count | reference_count | No |
| Vendor | vendor | No |
| Runtime | runtime | No |
| Execution Env | execution_environment | No |
| Last Editor | last_editor | No |
| Last Modified | last_modified | Yes (default) |
| Status | active | No |
