# EdgeDNS Module - Specification Catalog

## 1. Architecture Overview

**Main Files:**
- `ListView.vue` - List all DNS zones
- `CreateView.vue` - Create new DNS zone
- `EditView.vue` - Edit zone & manage records (tabs)
- `FormFieldsEdgeDns.vue`, `FormFieldsEditEdgeDns.vue`, `FormFieldsRecords.vue`
- `Config/dnssec.js` - DNSSEC field definitions

---

## 2. API Endpoints

### Zone Operations
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `v4/workspace/dns/zones` | List all zones |
| GET | `v4/workspace/dns/zones/{id}` | Load single zone |
| POST | `v4/workspace/dns/zones` | Create new zone |
| PATCH | `v4/workspace/dns/zones/{id}` | Update zone |
| DELETE | `v4/workspace/dns/zones/{id}` | Delete zone |

### DNSSEC Operations
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `v4/workspace/dns/zones/{id}/dnssec` | Load DNSSEC config |
| PUT | `v4/workspace/dns/zones/{id}/dnssec` | Enable/disable DNSSEC |

### Records Operations
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `v4/workspace/dns/zones/{zoneId}/records` | List records |
| GET | `v4/workspace/dns/zones/{zoneId}/records/{id}` | Load record |
| POST | `v4/workspace/dns/zones/{zoneId}/records` | Create record |
| PUT | `v4/workspace/dns/zones/{zoneId}/records/{id}` | Update record |
| DELETE | `v4/workspace/dns/zones/{zoneId}/records/{id}` | Delete record |

---

## 3. Toast Messages

| Action | Message |
|--------|---------|
| Zone Created | "Your DNS zone has been created..." |
| Record Created | "Edge DNS Record has been created" |
| Record Updated | "Edge DNS Record has been updated" |
| Record Deleted | "Edge DNS Record successfully deleted" |
| Zone Updated | "Edge DNS has been updated" |
| Zone Deleted | "Your Edge DNS has been deleted" |
| Copy Nameserver | "Successfully copied!" |

---

## 4. Validation Rules

### Zone Creation
```javascript
yup.object({
  name: yup.string().required(),
  domain: yup.string().required()
    .test('valid-domain', 'Invalid domain', /^(?:[-A-Za-z0-9]+\.)+[A-Za-z]{2,6}$/),
  dnssec: yup.boolean(),
  isActive: yup.boolean()
})
```

### DNS Record
```javascript
yup.object({
  name: yup.string().required(),
  selectedRecordType: yup.string().required(),
  value: yup.string().required(),
  ttl: yup.number().when('selectedRecordType', {
    is: 'ANAME', then: notRequired, otherwise: min(0).max(2147483647).required()
  }),
  selectedPolicy: yup.string().required().default('simple'),
  weight: yup.number().when('selectedPolicy', {
    is: 'weighted', then: min(0).max(255).required()
  }),
  description: yup.string()
})
```

---

## 5. Data-TestIDs

### Zone Form
- `edge-dns-form__name`
- `edge-dns-form__domain`
- `edge-dns-form__dnssec`
- `edge-dns-form__key-tag`
- `edge-dns-form__algorithm`
- `edge-dns-form__digestType`
- `edge-dns-form__digest`
- `edge-dns-form__status`
- `edge-dns-form__nameserver`

### Edit View Tabs
- `edge-dns-edit-view__main-settings__tab-panel`
- `edge-dns-edit-view__records__tab-panel`

### Records Form
- `edge-dns-records-form__section__settings`
- `edge-dns-records-form__settings__name-field__input`
- `edge-dns-records-form__settings__record-type-field`
- `edge-dns-records-form__settings__ttl-field`
- `edge-dns-records-form__settings__value-field`
- `edge-dns-records-form__section__policy`
- `edge-dns-records-form__policy__policy-type-field`
- `edge-dns-records-form__policy__weight-field`
- `edge-dns-records-form__policy__description-field`
- `create_Record_button`

---

## 6. Routes & Navigation

| Path | Name | Component |
|------|------|-----------|
| `/edge-dns` | `list-edge-dns` | ListView.vue |
| `/edge-dns/create` | `create-edge-dns` | CreateView.vue |
| `/edge-dns/edit/:id` | `edit-edge-dns` | EditView.vue |
| `/edge-dns/edit/:id/records` | `edge-dns-records` | EditView.vue |

---

## 7. Test Scenarios

### CREATE Scenarios
1. **Create Zone - Valid** - Fill name, domain, isActive
2. **Create Zone with DNSSEC** - Enable DNSSEC, polling for keys
3. **Create Zone - Invalid Domain** - Validation error
4. **Create Record - Valid** - Type=A, name, value, ttl, policy
5. **Create Record - Weighted Policy** - With weight 0-255
6. **Create Record - ANAME** - TTL field disabled

### READ Scenarios
7. **List Zones** - Columns: ID, Name, Domain, Status
8. **List Records** - Columns: ID, Name, Type, Value, TTL, Policy
9. **Load Zone Details** - Name, domain, status, nameservers, DNSSEC
10. **Load Record Details** - Drawer with all fields
11. **Load DNSSEC Config** - Key Tag, Algorithm, Digest Type, Digest

### UPDATE Scenarios
12. **Edit Zone - Name Only** - Change name, save
13. **Edit Zone - Status Toggle** - Toggle isActive
14. **Edit Zone - Enable DNSSEC** - Polling starts for keys
15. **Edit Record - All Fields** - Update all record fields
16. **Edit Record - Policy Change** - simple→weighted

### DELETE Scenarios
17. **Delete Zone** - Delete, verify removed
18. **Delete Record** - Delete, verify removed

### EDGE CASES
19. **DNSSEC Polling** - Refresh every 5 seconds
20. **Tab Navigation** - Main Settings ↔ Records
21. **Copy Nameserver** - Copy button + toast
22. **Domain Lock** - Domain field disabled in edit mode
