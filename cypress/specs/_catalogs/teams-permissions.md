# TeamsPermissions Module - Specification Catalog

## 1. Architecture Overview

```
TeamsPermissions/
├── ListView.vue                    # List team permissions
├── CreateView.vue                  # Create new team
├── EditView.vue                    # Edit existing team
└── FormFields/FormFieldsTeamPermissions.vue  # Form fields
```

---

## 2. API Endpoints

### Base URLs
- Teams: `v4/iam/teams`
- Permissions: `v4/iam/permissions`

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/teams` | List team permissions |
| POST | `/teams` | Create team |
| GET | `/teams/{id}` | Load team |
| PUT | `/teams/{id}` | Update team |
| DELETE | `/teams/{id}` | Delete team |
| GET | `/permissions?page_size=100` | List available permissions |

### Payload Structure
```javascript
{
  name: string,
  permissions_ids: number[],
  is_active: boolean
}
```

---

## 3. Toast Messages

| Action | Message |
|--------|---------|
| Create | "Your Team Permission has been created" |
| Update | "Your Team Permission has been updated" |
| Delete | "Team Permission successfully deleted" |

---

## 4. Validation Rules

### Schema
```javascript
yup.object({
  name: yup.string().required(),
  permissions: yup.array().required().min(1),
  isActive: yup.boolean()
})
```

### Initial Values
```javascript
{
  name: '',
  permissions: [],
  isActive: true
}
```

---

## 5. Data-TestIDs

### Page Level
- `teams-permissions__list-view__page-heading`
- `teams-permissions__list-view__empty-results-block`
- `teams-permissions__create-view__page-heading`
- `teams-permissions__edit-view__page-heading`

### Form Sections
- `teams-permissions-form__section__general`
- `teams-permissions-form__section__permissions`
- `teams-permissions-form__section__status`

### Form Fields
- `teams-permissions-form__name__field-text`
- `teams-permissions-form__permissions-field__picklist`
- `teams-permissions-form__permissions-field-picklist__source-list`
- `teams-permissions-form__permissions-field-picklist__target-list`
- `teams-permissions-form__permissions-field-picklist__move-to-target-btn`
- `teams-permissions-form__permissions-field-picklist__move-to-source-btn`
- `teams-permissions-form__status-field__switch`

---

## 6. Routes

| Path | Name | Component |
|------|------|-----------|
| `/teams-permission` | `teams-permission` | ListView.vue |
| `/teams-permission/create` | `create-teams-permission` | CreateView.vue |
| `/teams-permission/edit/:id` | `edit-teams-permission` | EditView.vue |

---

## 7. Test Scenarios

### CREATE Operations
1. **Navigate** to create page
2. **Fill Form**: Name + select permissions
3. **Submit**: POST to API with permissions_ids array
4. **Verify**: Toast + redirect to edit view

### READ/LIST Operations
5. **List Teams**: Columns - Name, Permissions count, Status
6. **Status Tags**: Active (success) / Inactive (danger)
7. **Empty State**: "No teams found." message

### UPDATE Operations
8. **Load Team**: GET by ID
9. **Modify Fields**: Name, permissions, status
10. **Submit**: PUT to API
11. **Verify**: Toast + redirect to list

### DELETE Operations
12. **Click Delete**: Action on row
13. **Confirm**: Deletion
14. **Verify**: Toast + removed from list

---

## PickList Component

### Structure
- **Source List**: Available permissions
- **Target List**: Selected permissions

### Controls
| Button | TestID | Action |
|--------|--------|--------|
| Move to Target | `move-to-target-btn` | Add selected to target |
| Move to Source | `move-to-source-btn` | Remove selected from target |
| Move All to Target | `move-all-to-target-btn` | Add all to target |
| Move All to Source | `move-all-to-source-btn` | Remove all from target |

---

## Status Field

| Value | Display | Severity |
|-------|---------|----------|
| true | Active | success |
| false | Inactive | danger |

### Description
"Activate or deactivate the team permissions for all users assigned to the team."

---

## Caching

After CREATE/UPDATE/DELETE:
- `teamsService.invalidateTeamsCache()` called
- Ensures dependent modules see updated data
