# Variables Module - Specification Catalog

## 1. Architecture Overview

```
Variables/
├── ListView.vue                    # List view with table and delete
├── CreateView.vue                  # Create form with validation
├── EditView.vue                    # Edit form with load/update
└── FormFields/FormFieldsVariables.vue  # Reusable form fields
```

---

## 2. API Endpoints

### Base URL: `v3/variables`

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/` | List all variables |
| POST | `/` | Create new variable |
| GET | `/{id}` | Load single variable |
| PUT | `/{id}` | Update variable |
| DELETE | `/{id}` | Delete variable |

### Request Model
```javascript
{
  key: string,      // Required, uppercase + numbers + underscore
  value: string,    // Required
  secret: boolean   // Required, default false
}
```

---

## 3. Toast Messages

| Action | Message |
|--------|---------|
| Create | "Your variable has been created" |
| Update | "Your variable has been updated" |
| Delete | "Variable successfully deleted" |

---

## 4. Validation Rules

### Schema
```javascript
yup.object({
  key: yup.string()
    .test('key', 'Invalid key format', (value) => /^[A-Z0-9_]*$/.test(value))
    .required(),
  value: yup.string().required(),
  secret: yup.boolean().required().default(false)
})
```

### Key Validation
- **Pattern:** `/^[A-Z0-9_]*$/`
- **Allowed:** Uppercase letters (A-Z), numbers (0-9), underscore (_)
- **Not allowed:** Lowercase, special characters, spaces

### Business Rules
- Once secret, behavior cannot be edited
- Secret values are masked in list view
- Duplicate keys not allowed (API validates)

---

## 5. Data-TestIDs

| TestID | Purpose |
|--------|---------|
| `variables-form__key-field` | Key input field |
| `variables-form__value-field` | Value input field |
| `variables-form__secret-field` | Secret toggle switch |

---

## 6. Routes

| Path | Name | Component |
|------|------|-----------|
| `/variables` | `list-variables` | ListView.vue |
| `/variables/create` | `create-variables` | CreateView.vue |
| `/variables/edit/:id` | `edit-variables` | EditView.vue |

### Redirects
- Create non-secret → Edit page with link
- Create secret → List page (no edit link)

---

## 7. Test Scenarios

### CREATE Operations
1. **Successful Creation** - Valid key, value, secret flag
2. **Create Non-Secret** - Toast with edit link
3. **Create Secret** - Redirect to list only
4. **Duplicate Key Error** - API 400 error
5. **Invalid Key Format** - Validation error before submit
6. **API Errors** - 401, 403, 404, 500 handling

### READ Operations
7. **List All Variables** - Table with Key, Value, Last Editor, Last Update
8. **Empty Results** - EmptyResultsBlock with create button
9. **List Parsing** - Date formatting, secret masking
10. **Load Single Variable** - Form populated for edit
11. **Secret Display** - Value masked, no copy button

### UPDATE Operations
12. **Successful Update** - Modify and save
13. **Non-Editable Fields** - Secret field locked after creation
14. **Validation on Update** - Same rules apply
15. **Update Errors** - API error handling

### DELETE Operations
16. **Successful Delete** - Item removed from list
17. **Delete Non-Existent** - 404 error
18. **Delete Permission Denied** - 403 error

---

## Error Handling

| Status | Error Type |
|--------|-----------|
| 400 | Bad Request (field errors) |
| 401 | InvalidApiTokenError |
| 403 | PermissionError |
| 404 | NotFoundError |
| 500 | InternalServerError |
| Other | UnexpectedError |

---

## Analytics Events

| Event | Trigger |
|-------|---------|
| `productCreated` | Create success |
| `failedToCreate` | Create error |
| `productEdited` | Update success |
| `failedToEdit` | Update error |
| `clickToCreate` | Create button click |
| `clickToEdit` | Edit action click |
