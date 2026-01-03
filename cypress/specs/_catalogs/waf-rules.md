# WAF Rules Module - Specification Catalog

## 1. Architecture Overview

| File | Purpose |
|------|---------|
| `ListView.vue` | Lists all WAF rules with clone/delete |
| `CreateView.vue` | Create new WAF rules |
| `EditView.vue` | Edit existing WAF rules |
| `TabsView.vue` | Tabs: Main Settings, Tuning, Allowed Rules |
| `ListWafRulesAllowed.vue` | Allowed rules whitelist |
| `ListWafRulesTuning.vue` | Analyze blocked requests |
| `FormFieldsWafRules.vue` | WAF rule form fields |
| `FormFieldsAllowed.vue` | Allowed rule conditions |
| `Drawer/index.vue` | Attack details drawer |
| `Dialog/index.vue` | Create allowed rules from attacks |

---

## 2. API Endpoints

### WAF Rules Management
| Method | Function | Purpose |
|--------|----------|---------|
| GET | `listWafRules()` | List all WAF rules |
| POST | `createWafRule(payload)` | Create WAF rule |
| PUT | `editWafRule(payload, ruleId)` | Update WAF rule |
| DELETE | `deleteWafRule(id)` | Delete WAF rule |
| GET | `loadWafRule({ id })` | Fetch single rule |
| POST | `cloneWafRule(payload)` | Clone WAF rule |

### Allowed Rules Management
| Method | Function |
|--------|----------|
| GET | `listWafRulesAllowed({ wafId })` |
| POST | `createWafRuleAllowed({ payload, id })` |
| PUT | `editWafRuleAllowed({ payload, wafId, allowedId })` |
| DELETE | `deleteWafRuleAllowed({ wafId, allowedId })` |

### Tuning
| Method | Function |
|--------|----------|
| GET | `listWafRulesTuningService(params)` |
| GET | `listWafRulesTuningAttacksService(params)` |
| POST | `createWafRulesAllowedTuning({ attackEvents, wafId, name })` |

---

## 3. Toast Messages

| Scenario | Message |
|----------|---------|
| WAF Rule Created | "Your waf rule has been created" |
| Network List IP Conflict | "The ip address field cannot be used together with an IP/CIDR Network List filter." |
| Network List Country Conflict | "The country field cannot be used together with a Country Network List filter." |

---

## 4. Validation Rules

### Main WAF Rule Schema
```javascript
yup.object({
  name: yup.string().required(),
  sqlInjection: yup.boolean(),
  sqlInjectionSensitivity: yup.string(),
  remoteFileInclusion: yup.boolean(),
  remoteFileInclusionSensitivity: yup.string(),
  directoryTraversal: yup.boolean(),
  directoryTraversalSensitivity: yup.string(),
  crossSiteScripting: yup.boolean(),
  crossSiteScriptingSensitivity: yup.string(),
  fileUpload: yup.boolean(),
  fileUploadSensitivity: yup.string(),
  evadingTricks: yup.boolean(),
  evadingTricksSensitivity: yup.string(),
  unwantedAccess: yup.boolean(),
  unwantedAccessSensitivity: yup.string(),
  identifiedAttack: yup.boolean(),
  identifiedAttackSensitivity: yup.string(),
  active: yup.boolean()
})
```

### Sensitivity Levels
`['highest', 'high', 'medium', 'low', 'lowest']`

### Allowed Rules Schema
```javascript
yup.object({
  ruleId: yup.string().required(),
  name: yup.string().required(),
  path: yup.string().nullable(),
  conditions: yup.array().of(yup.object({
    field: yup.string().when('match', {
      is: (match) => match.startsWith('specific_'),
      then: (s) => s.required()
    }),
    match: yup.string().required()
  })),
  status: yup.boolean(),
  operator: yup.boolean()
})
```

---

## 5. Data-TestIDs

### TabsView
- `waf-rules-tabs__tab__main-settings`
- `waf-rules-tabs__tab__tuning`
- `waf-rules-tabs__tab__allowed-rules`

### Form Fields
- `waf-rules-form__name-field`
- `waf-rules-form__active-field`
- `allowed-rules-form__rule-id`
- `allowed-rules-form__description-field`
- `allowed-rules-form__path-field`
- `allowed-rules-form__match-zone[${index}]-field`
- `allowed-rules-form__add-match-zone__button`
- `allowed-rules-form__use-regex-field`
- `allowed-rules-form__status-field`

### Tuning
- `waf-tuning-list__domains-field`
- `waf-tuning-list__network-list-field`
- `create_Allowed Rule_button`

---

## 6. Routes

| Route | Path | Component |
|-------|------|-----------|
| List | `/waf` | ListView.vue |
| Create | `/waf/create` | CreateView.vue |
| Edit | `/waf/edit/:id/:tab?` | TabsView.vue |

### Tab Mapping
- `mainSettings` → 0
- `tuning` → 1
- `allowed` → 2

---

## 7. Test Scenarios

### CREATE Operations
1. **Create WAF Rule** - Name, threat configs, active status
2. **Create Allowed Rule** - Rule ID, name, path, conditions
3. **Create Allowed from Tuning** - Select attacks, create allowed

### READ Operations
4. **List WAF Rules** - Columns: ID, Name, Threat Types, Status
5. **Edit WAF Rule** - Load Main Settings, Tuning, Allowed Rules tabs
6. **List Allowed Rules** - Columns: Rule ID, Description, Path, Status

### UPDATE Operations
7. **Update WAF Rule** - Modify name, sensitivity levels
8. **Update Allowed Rule** - Modify conditions, path, status

### DELETE Operations
9. **Delete WAF Rule** - Confirm, remove from list
10. **Delete Allowed Rule** - Remove from allowed list

### TUNING Operations
11. **Filter Attacks** - Time range, domains, network lists
12. **Create from Attacks** - Select events, create allowed rule

---

## Key Constants

| Constant | Description |
|----------|-------------|
| Threat Types | 8 types (SQL Injection, XSS, RFI, etc.) |
| Sensitivity Levels | 5 levels |
| Condition Types | 24 match zone options |
| Rule IDs | 76 predefined rule IDs |
| Time Ranges | 1h, 3h, 6h, 12h, 24h, 48h, 72h |
