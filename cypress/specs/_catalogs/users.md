# Users Module - Specification Catalog

## 1. Architecture Overview

```
Users/
├── ListView.vue                    # List users with CRUD
├── CreateView.vue                  # Create new user
├── EditView.vue                    # Edit existing user
└── FormFields/FormFieldsUsers.vue  # Reusable form fields
```

---

## 2. API Endpoints

### Base URL: `v4/iam/users`

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/` | List users |
| POST | `/` | Create user |
| GET | `/{id}` | Load user |
| PATCH | `/{id}` | Update user |
| DELETE | `/{id}` | Delete user |

### GraphQL Endpoints
- **Timezones**: `query alltimezones { allTimezones }`
- **Countries**: `query allCountries { allCountries { name, code2, phone } }`

### Related APIs
- **Teams**: `GET v3/iam/teams?ordering=name&page_size=100`

---

## 3. Toast Messages

| Action | Message |
|--------|---------|
| Create | "Your user has been created" |
| Update | "Your user has been updated" |
| Email Changed | "Email sent" + "The user must check inbox..." |
| Delete | "User successfully deleted" |

---

## 4. Validation Rules

### Create Schema
```javascript
yup.object({
  firstName: yup.string().required().max(30),
  lastName: yup.string().required().max(30),
  timezone: yup.string().required(),
  language: yup.string(),
  email: yup.string().email().required().max(254),
  countryCallCode: yup.string().required(),
  mobile: yup.string().required().max(20),
  isAccountOwner: yup.boolean(),
  teamsIds: yup.array().when('isAccountOwner', {
    is: true, then: (s) => s,
    otherwise: (s) => s.min(1)
  }),
  twoFactorEnabled: yup.boolean(),
  isActive: yup.boolean().required()
})
```

### Conditional Rules
- Account Owner: Teams optional
- MFA Enforcement: Toggle disabled if account has MFA enabled for all
- Current Account Owner: Cannot modify own owner flag

---

## 5. Data-TestIDs

### Page Level
- `users__list-view__page-heading`
- `users__list-view__empty-results-block`
- `users__create-view__page-heading`
- `users__edit-view__page-heading`

### Form Sections
- `users-form__section__profile`
- `users-form__section__contact-information`
- `users-form__section__security-settings`

### Profile Fields
- `users-form__first-name-field`
- `users-form__last-name-field`
- `users-form__timezone-field`
- `users-form__language-field__dropdown`

### Contact Fields
- `users-form__email-field`
- `users-form__phone-field__dropdown`
- `users-form__phone-field__input`

### Security Fields
- `users-form__teams-field__multiselect`
- `users-form__mfa-field`
- `user-form__active-field`

---

## 6. Routes

| Path | Name | Component |
|------|------|-----------|
| `/users` | `list-users` | ListView.vue |
| `/users/create` | `create-users` | CreateView.vue |
| `/users/edit/:id` | `edit-users` | EditView.vue |

---

## 7. Test Scenarios

### CREATE Operations
1. **Navigate** to `/users/create`
2. **Fill Form**: All required fields
3. **Submit**: POST to API
4. **Verify**: Toast + redirect to list

### READ/LIST Operations
5. **List Users**: Columns - Name, Email, Teams, MFA, Owner, Status
6. **Search/Filter**: By name, email
7. **Pagination**: 10 items per page
8. **Note**: Excludes current logged-in user

### UPDATE Operations
9. **Load User**: GET by ID
10. **Modify Fields**: Any editable field
11. **Submit**: PATCH to API
12. **Email Change**: Warning toast + verification email

### DELETE Operations
13. **Click Delete**: Action on user row
14. **Confirm**: Deletion
15. **Verify**: Toast + removed from list

---

## Field Mapping

| Form Field | API Field |
|------------|-----------|
| firstName | first_name |
| lastName | last_name |
| countryCallCode | country_call_code |
| isAccountOwner | is_account_owner |
| teamsIds | teams_ids |
| twoFactorEnabled | two_factor_enabled |
| isActive | is_active |

---

## Special Behaviors

- Current user excluded from list
- Account owner cannot change own owner status
- MFA can be force-enabled at account level
- Email verification required on change
- Language field disabled (English only)
- Default timezone: GMT
- Default team: First team in list
