# Credentials Module - Specification Catalog

## 1. Architecture Overview

```
Credentials/
├── TabsView.vue                    # Main container with tabs
├── ObjectStorageCredentials/
│   └── ListView.vue                # Credentials list view
├── Drawer/index.vue                # Create credential drawer
└── FormFields/FormFieldsCredential.vue  # Form fields
```

---

## 2. API Endpoints

### Base URL: `v4/workspace/storage`

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/credentials` | List credentials |
| POST | `/credentials` | Create credential |
| DELETE | `/credentials/{id}` | Delete credential |
| GET | `/buckets` | List buckets (for dropdown) |

---

## 3. Toast Messages

| Action | Message |
|--------|---------|
| Create | `Credential "${name}" has been created successfully` |
| Error | `Failed to load buckets` |
| Delete Error | `${fieldName}: ${message}` |

---

## 4. Validation Rules

### Schema
```javascript
yup.object({
  name: yup.string().required()
    .matches(/^[a-zA-Z0-9-]+$/, 'Letters, numbers, hyphens only'),
  bucket: yup.string().required(),
  capabilities: yup.array().min(1, 'At least one capability'),
  expirationDate: yup.date().required()
})
```

### Field Constraints
| Field | Type | Validation |
|-------|------|-----------|
| name | String | Required, regex: `^[a-zA-Z0-9-]+$` |
| bucket | String | Required, select from dropdown |
| capabilities | Array | Required, min 1 item |
| expirationDate | Date | Required, min: today |

---

## 5. Data-TestIDs

| TestID | Purpose |
|--------|---------|
| `credentials-content-block` | Main content wrapper |
| `credentials-heading` | Page title block |
| `credentials-tab-panel__Object Storage__tab` | Object Storage tab |
| `credential-form__name-field` | Name input |
| `credential-form__bucket-field` | Bucket dropdown |
| `credential-form__expiration-field` | Expiration date picker |
| `credential-form__capabilities-field` | Capabilities multi-select |

---

## 6. Routes

| Path | Name | Component |
|------|------|-----------|
| `/credentials` | `credentials` | TabsView.vue |
| `/credentials/:tab?` | `credentials-tabs` | TabsView.vue |

### Tab Values
- `object-storage` → index 0

---

## 7. Test Scenarios

### CREATE Operations
1. **Create Credential** - Fill all required fields, submit
2. **Validate Name** - Invalid characters error
3. **Validate Required Fields** - All fields mandatory
4. **Validate Expiration** - Cannot select past date
5. **Load Buckets on Mount** - Dropdown populated

### READ Operations
6. **List Credentials** - Columns: name, accessKey, capabilities, bucket, dates
7. **Tab Navigation** - Switch between tabs

### DELETE Operations (No Update)
8. **Delete Credential** - Remove from list
9. **Delete Error Handling** - Toast with error message

---

## Capabilities

| Value | Display |
|-------|---------|
| listFiles | List Files |
| readFiles | Read Files |
| writeFiles | Write Files |
| deleteFiles | Delete Files |
| listAllBucketNames | List All Bucket Names |
| listBuckets | List Buckets |

---

## Data Transformation

### API Response → Display
```javascript
{
  id: "credential-123",
  name: "my-cred",
  access_key: "AKIA...",
  capabilities: ["listFiles", "readFiles"],
  last_modified: "2024-12-21T10:30:00Z",
  expiration_date: "2025-12-31T23:59:59Z",
  buckets: ["my-bucket"]
}
→
{
  id: "credential-123",
  name: "my-cred",
  accessKey: "AKIA...",
  capabilities: ["List Files", "Read Files"],
  createDate: "21/12/2024 10:30",
  expirationDate: "31/12/2025 23:59",
  bucket: "my-bucket"
}
```
