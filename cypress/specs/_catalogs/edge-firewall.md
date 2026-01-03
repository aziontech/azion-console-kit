# EdgeFirewall Module - Specification Catalog

## 1. Architecture Overview

### Main Files
```
EdgeFirewall/
├── ListView.vue              # List all firewalls
├── CreateView.vue            # Create page
├── EditView.vue              # Edit form
├── TabsView.vue              # Edit with tabs (main settings, functions, rules engine)
├── Drawer/
│   └── index.vue             # Inline create drawer
└── FormFields/
    └── FormFieldsEdgeFirewall.vue  # Common form fields
```

---

## 2. API Endpoints

### Base URL
```
v4/workspace/firewalls
```

### Service Methods

| Method | HTTP | Endpoint | Purpose |
|--------|------|----------|---------|
| `listEdgeFirewallService` | GET | `/v4/workspace/firewalls` | List all firewalls |
| `createEdgeFirewallService` | POST | `/v4/workspace/firewalls` | Create new firewall |
| `loadEdgeFirewallService` | GET | `/v4/workspace/firewalls/{id}` | Load single firewall |
| `editEdgeFirewallService` | PATCH | `/v4/workspace/firewalls/{id}` | Update firewall |
| `deleteEdgeFirewallService` | DELETE | `/v4/workspace/firewalls/{id}` | Delete firewall |
| `cloneEdgeFirewallService` | POST | `/v4/workspace/firewalls/{id}/clone` | Clone firewall |

### Payload Structure
```javascript
{
  name: string,
  active: boolean,
  debug: boolean,
  modules: {
    ddos_protection: { enabled: boolean },
    functions: { enabled: boolean },
    network_protection: { enabled: boolean },
    waf: { enabled: boolean }
  }
}
```

---

## 3. Toast Messages

| Operation | Message |
|-----------|---------|
| Create Firewall | "Your Firewall has been created" |
| Update Firewall | "Your Firewall has been updated" |
| Delete Firewall | "Your Firewall has been deleted" |
| Clone Firewall | "Your Firewall has been cloned" |
| Create Function Instance | "Your Function has been created" |
| Create Rule | "Rule Engine successfully created" |
| Delete Rule | "Rules Engine successfully deleted" |
| Reorder Rules | "Reorder saved" |

---

## 4. Validation Rules

### Yup Schema
```javascript
yup.object({
  name: yup.string().required().label('Name'),
  edgeFunctionsEnabled: yup.boolean(),
  networkProtectionEnabled: yup.boolean(),
  wafEnabled: yup.boolean(),
  isActive: yup.boolean(),
  domains: yup.array(),
  debugRules: yup.boolean()
})
```

### Initial Values (Create)
```javascript
{
  name: '',
  isActive: true,
  debugRules: false,
  edgeFunctionsEnabled: true,
  networkProtectionEnabled: true,
  wafEnabled: false,
  ddosProtectionUnmetered: true
}
```

---

## 5. Data-TestIDs

### Form Fields
- `edge-firewall-form__name-field`

### Buttons
- `create_Edge Firewall_button`
- `form-actions-submit-button`
- `form-actions-cancel-button`

### Module Switches
- `field-group-switch__switch-edgeFunctionsEnabled__switch`
- `field-group-switch__switch-networkProtectionEnabled__switch`
- `field-group-switch__switch-wafEnabled__switch`
- `field-group-switch__switch-ddosProtectionUnmetered__switch`
- `field-group-switch__switch-debugRules__switch`
- `field-group-switch__switch-isActive__switch`

### Drawer
- `edge-firewall-drawer`

### Tabs
- `edge-firewall__main-settings-tab`
- `edge-firewall__functions-tab`
- `edge-firewall__rules-engine-tab`

---

## 6. Routes & Navigation

| Path | Name | Component |
|------|------|-----------|
| `/firewalls` | `list-firewalls` | ListView.vue |
| `/firewalls/create` | `create-firewall` | CreateView.vue |
| `/firewalls/edit/:id/:tab?` | `edit-firewall` | TabsView.vue |

### Tab Navigation
- `mainSettings` (index 0)
- `functions` (index 1)
- `rulesEngine` (index 2)

---

## 7. Test Scenarios

### CREATE Operations

1. **Basic Firewall Creation** - Enter name, save, verify toast
2. **Create with All Modules Enabled** - Enable WAF, Functions, save
3. **Create Function Instance** - Navigate to Functions tab, create instance
4. **Create with Network List** - Create rule with Network List criteria

### READ Operations

5. **List Firewalls** - Search, verify columns
6. **Edit Firewall Load** - Load data, display in form
7. **Tab Navigation** - Switch between tabs

### UPDATE Operations

8. **Edit Main Settings** - Modify name, modules, save
9. **Create Rule with Header Criteria** - Header Accept matching rule
10. **Create Rule with WAF** - Enable WAF behavior
11. **Reorder Rules** - Modify position, review changes, save

### DELETE Operations

12. **Delete Firewall** - Search, delete, verify removed
13. **Delete Rule** - Delete from Rules Engine
14. **Delete Function Instance** - Remove from Functions tab

### CLONE Operations

15. **Clone Firewall** - Clone with new name, verify created

---

## 8. Key Features

### Module Management
- **DDoS Protection**: Always enabled (locked)
- **Functions**: Toggleable, affects tab visibility
- **Network Shield**: Toggleable
- **WAF**: Toggleable, enables WAF rule behaviors

### Debug Rules
- When enabled, rules logged in Data Stream, Real-Time Events, GraphQL API

### Analytics Tracking
- `clickToCreate`, `clickToEdit`
- `productCreated`, `productEdited`
- `failedToCreate`, `failedToEdit`

---

## 9. Related Modules

- EdgeFirewallFunctions
- EdgeFirewallRulesEngine
- WAF Rules
- Network Lists
- Domains
