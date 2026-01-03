# EdgeStorage Module - Specification Catalog

## 1. Architecture Overview

| File | Purpose |
|------|---------|
| `View.vue` | Create/Edit Bucket with tabs (Main Settings, Credentials) |
| `ListView.vue` | File management with bucket selection, drag-drop |
| `CredentialsView.vue` | Credentials management table |
| `FormFieldsEdgeStorage.vue` | Bucket form (Name, Edge Access, Danger Zone) |
| `FormFieldsCredential.vue` | Credential form (Name, Capabilities, Expiration) |
| `CopyCredentialDialog.vue` | Modal for Access Key and Secret Key |
| `BucketListTable.vue` | Bucket list with actions |
| `DragAndDrop.vue` | Drag-drop upload interface |
| `ProgressCard.vue` | Upload/Delete progress tracker |
| `useEdgeStorage.js` | Composable for state management |

---

## 2. API Endpoints

### Buckets
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `v4/workspace/storage/buckets` | List buckets |
| POST | `v4/workspace/storage/buckets` | Create bucket |
| PATCH | `v4/workspace/storage/buckets/{name}` | Update bucket |
| DELETE | `v4/workspace/storage/buckets/{name}` | Delete bucket |

### Files/Objects
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `v4/workspace/storage/buckets/{name}/objects` | List files |
| POST | `v4/workspace/storage/buckets/{name}/objects/{path}` | Upload file |
| GET | `v4/workspace/storage/{bucketName}/objects/{fileName}` | Download file |
| DELETE | `v4/workspace/storage/buckets/{name}/objects/{fileName}` | Delete file |

### Credentials
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `v4/workspace/storage/credentials` | List credentials |
| POST | `v4/workspace/storage/credentials` | Create credential |
| DELETE | `v4/workspace/storage/credentials/{id}` | Delete credential |

---

## 3. Toast Messages

### Bucket Operations
| Type | Message |
|------|---------|
| Success | `Bucket "{name}" has been created successfully` |
| Success | `Bucket "{name}" has been updated successfully` |
| Success | `Bucket "{name}" has been deleted successfully` |

### File Operations
| Type | Message |
|------|---------|
| Success | `{count} file(s) uploaded successfully` |
| Warning | `Upload Partially Completed: {count} uploaded, {count} failed` |
| Error | `{count} file(s) have accented characters or cedilla. Not allowed.` |
| Warning | `{count} file(s) exceed 300MB limit` |
| Success | `{count} file(s) deleted successfully` |
| Error | `Error downloading files: {error}` |

---

## 4. Validation Rules

### Bucket Schema
```javascript
yup.object({
  name: yup.string().required().min(6).max(63)
    .test('name', 'Invalid format', /^[A-Za-z0-9_-]+$/),
  edge_access: yup.string().required()
    .oneOf(['read_write', 'read_only', 'restricted'])
})
```

### Credential Schema
```javascript
yup.object({
  name: yup.string().required()
    .matches(/^[a-zA-Z0-9-]+$/, 'Alphanumeric + hyphens only'),
  capabilities: yup.array().min(1, 'At least one capability'),
  expirationDate: yup.date().required()
})
```

### File Validation
- Max file size: 300MB
- File names: ASCII only (no accents/cedilla)

---

## 5. Data-TestIDs

### Form Fields
- `edge-storage-form__name-field`
- `edge-storage-form__edge-access-field`
- `credential-form__name-field`
- `credential-form__expiration-field`
- `credential-form__capabilities-field`

### Buttons
- `create_credential_button`
- `account-settings__delete-account` (Delete Bucket)

### Dialog
- `copy-credential-dialog__warning__inline-message`
- `copy-credential-dialog__access-key-field__label`
- `copy-credential-dialog__access-key-field__password-input`
- `copy-credential-dialog__access-key-field__copy-button`
- `copy-credential-dialog__secret-key-field__label`
- `copy-credential-dialog__secret-key-field__password-input`
- `copy-credential-dialog__secret-key-field__copy-button`
- `copy-credential-dialog__dialog-footer__confirm-button`

---

## 6. Routes

| Route Name | Path | Component |
|------------|------|-----------|
| `object-storage-list` | `/object-storage` | ListView.vue |
| `object-storage-view` | `/object-storage/:id` | ListView.vue |
| `object-storage-create` | `/object-storage/create` | View.vue |
| `object-storage-edit` | `/object-storage/:id/edit/:tab?` | View.vue |

### Tabs
- Tab 0: `main-settings`
- Tab 1: `credentials`

---

## 7. Test Scenarios

### BUCKET Operations
1. **Create Bucket** - Name (6-63 chars), Edge Access
2. **List Buckets** - Columns: Name, Size, Last Modified
3. **Update Bucket** - Modify Edge Access
4. **Delete Bucket** - Confirm with bucket name

### FILE Operations
5. **Upload Files** - Click or drag-drop, progress tracking
6. **Upload Folder** - Preserve folder structure
7. **List Files** - Pagination, folder navigation
8. **Download Single File** - Direct download
9. **Download Multiple Files** - ZIP download
10. **Delete Single File** - Confirm deletion
11. **Delete Multiple Files** - Batch with progress

### CREDENTIAL Operations
12. **Create Credential** - Name, Capabilities, Expiration
13. **Copy Access/Secret Keys** - From dialog
14. **List Credentials** - Table with columns
15. **Delete Credential** - Remove from table

### VALIDATION
16. **Invalid Bucket Name** - Less than 6 chars, special chars
17. **File Size Exceeded** - Over 300MB
18. **Invalid Characters** - Accented chars in filename

### NAVIGATION
19. **Tab Navigation** - Main Settings ↔ Credentials
20. **Breadcrumb Navigation** - Folder hierarchy
21. **Drag-Drop Upload** - Visual feedback, trigger upload

---

## Capabilities Options

| Capability | Description |
|------------|-------------|
| `listFiles` | List files in bucket |
| `readFiles` | Read/download files |
| `writeFiles` | Upload/write files |
| `deleteFiles` | Delete files |
| `listAllBucketNames` | List all bucket names |
| `listBuckets` | List buckets with details |
