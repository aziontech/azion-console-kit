# NetworkLists Module - Specification Catalog

## 1. Architecture Overview

```
NetworkLists/
├── ListView.vue                    # List all network lists
├── CreateView.vue                  # Create new network list
├── EditView.vue                    # Edit existing network list
├── Drawer/index.vue                # Create drawer component
└── FormFields/
    ├── FormFieldsCreateNetworkLists.vue
    └── FormFieldsEditNetworkLists.vue
```

---

## 2. API Endpoints

### Base URL: `v4/workspace/network_lists`

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/network_lists` | List all network lists |
| POST | `/network_lists` | Create network list |
| GET | `/network_lists/{id}` | Load single list |
| PUT | `/network_lists/{id}` | Update network list |
| DELETE | `/network_lists/{id}` | Delete network list |

### GraphQL Endpoint
```graphql
query all_countries_with_code { allCountries { name, code2 } }
```

---

## 3. Toast Messages

| Action | Message |
|--------|---------|
| Create | "Your network list has been created" |
| Create (Drawer) | "Your Network has been created" |
| Delete | "Network list successfully deleted." |

---

## 4. Validation Rules

### Create Schema
```javascript
yup.object({
  name: yup.string().required(),
  networkListType: yup.string().oneOf(['asn', 'countries', 'ip_cidr']),
  selectedCountries: yup.array().when('networkListType', {
    is: 'countries',
    then: (s) => s.required().min(1)
  }),
  ipCidr: yup.string().when('networkListType', {
    is: 'ip_cidr',
    then: (s) => s.required()
  }),
  asn: yup.string().when('networkListType', {
    is: 'asn',
    then: (s) => s.required()
  })
})
```

### Edit Schema
```javascript
yup.object({
  name: yup.string().required(),
  itemsValues: yup.string()
    .when('networkListType', {
      is: 'asn', then: (s) => s.required()
    })
    .when('networkListType', {
      is: 'ip_cidr', then: (s) => s.required()
    })
    .test('no-empty-lines', 'No empty lines allowed', (value) => {
      return value.split('\n').every((line) => line.trim() !== '')
    }),
  itemsValuesCountry: yup.array().when('networkListType', {
    is: 'countries',
    then: (s) => s.required().min(1)
  })
})
```

---

## 5. Data-TestIDs

| TestID | Purpose |
|--------|---------|
| `network-list-form__name` | Name input field |
| `network-list-form__asn-list` | ASN list textarea |
| `network-list-form__ipcidr-list` | IP/CIDR list textarea |
| `network-list-form__countries__multiselect` | Countries multiselect |
| `network-drawer` | Create drawer |

---

## 6. Routes

| Path | Name | Component |
|------|------|-----------|
| `/network-lists` | `list-network-list` | ListView.vue |
| `/network-lists/create` | `create-network-list` | CreateView.vue |
| `/network-lists/edit/:id` | `edit-network-list` | EditView.vue |

---

## 7. Test Scenarios

### CREATE Operations
1. **Create ASN List** - Name + ASN values (newline separated)
2. **Create IP/CIDR List** - Name + IP/CIDR values
3. **Create Countries List** - Name + country selection
4. **Validation - Missing Name** - Required error
5. **Validation - Missing Items** - Type-specific required error
6. **Create via Drawer** - Drawer creation flow

### READ Operations
7. **List Network Lists** - Columns: ID, Name, Type, Last Editor
8. **Empty State** - "No network lists" with create button
9. **Load Single List** - Verify all fields populated

### UPDATE Operations
10. **Edit ASN List** - Modify ASN values
11. **Edit IP/CIDR List** - Modify IP values
12. **Edit Countries List** - Modify country selection
13. **Type Locked** - Cannot change type after creation
14. **Validation - Empty Lines** - No empty lines allowed

### DELETE Operations
15. **Delete List** - Confirm and remove from list

---

## Network Types

| Type | Field | Format |
|------|-------|--------|
| `asn` | ASN numbers | Newline separated |
| `ip_cidr` | IP addresses/CIDR | Newline separated |
| `countries` | Country codes | Array of 2-char codes |

---

## Data Transformations

### List Transform
- `type` → `listType` (ASN, IP/CIDR, Countries)
- `last_modified` → formatted date

### Load Transform
- `items` → `itemsValues` (newline string) or `itemsValuesCountry` (array)

### Save Transform
- `itemsValues` → `items` array (split by newline)
- `itemsValuesCountry` → `items` array (country codes)
