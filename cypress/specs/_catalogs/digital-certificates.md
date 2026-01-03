# DigitalCertificates Module - Specification Catalog

## 1. Architecture Overview

```
DigitalCertificates/
├── ListView.vue                    # List/dashboard for certificates and CRL
├── CreateView.vue                  # Create new certificate form
├── EditView.vue                    # Edit existing certificate
├── CreateMenuBlock.vue             # Dropdown menu for creation options
├── Drawer/index.vue                # Reusable certificate creation drawer
└── FormFields/
    ├── FormFieldsCreateDigitalCertificates.vue
    ├── FormFieldsEditDigitalCertificates.vue
    ├── InlineMessage.vue           # Let's Encrypt info
    └── blocks/
        ├── General.vue             # Name field
        ├── ImportServerCertificate.vue
        ├── ImportRequestCertificate.vue
        └── RequestCertificate.vue  # CSR generation
```

---

## 2. API Endpoints

### Digital Certificates: `v4/workspace/tls/certificates`
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/` | Create certificate |
| GET | `/` | List certificates |
| GET | `/{id}` | Load certificate |
| PUT | `/{id}` | Update certificate |
| DELETE | `/{id}` | Delete certificate |
| POST | `/request` | Create Let's Encrypt |

### CSR: `v4/workspace/tls/csr`
| Method | Purpose |
|--------|---------|
| POST | Generate CSR |

### CRL: `v4/workspace/tls/crls`
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/` | List CRLs |
| POST | `/` | Create CRL |
| GET | `/{id}` | Load CRL |
| PUT | `/{id}` | Update CRL |
| DELETE | `/{id}` | Delete CRL |

---

## 3. Toast Messages

| Action | Message |
|--------|---------|
| Create Certificate | "Your digital certificate has been created!" |
| Update Certificate | "Your digital certificate has been updated!" |
| Update CRL | "Your CRL has been updated!" |
| Delete Certificate | "Digital certificate successfully deleted!" |
| Delete CRL | "CRL successfully deleted!" |

---

## 4. Validation Rules

### Certificate Types
- `edge_certificate` - Server certificate upload
- `generateCSR` - CSR generation
- `trusted_ca_certificate` - Trusted CA import
- `certificateRevogationList` - CRL import

### Create Validation
```javascript
yup.object({
  digitalCertificateName: yup.string().required(),
  certificateType: yup.string().required(),
  certificate: yup.string().when('certificateType', {
    is: () => type === 'trusted' || isWorkload,
    then: (s) => s.required()
  }),
  privateKey: yup.string().when('certificateType', {
    is: () => type === 'trusted' || isWorkload,
    then: (s) => s.required()
  }),
  // CSR Fields (when type === 'generateCSR')
  common: yup.string().required(),
  country: yup.string().required().min(2).max(2),
  state: yup.string().required(),
  city: yup.string().required(),
  organization: yup.string().required(),
  organizationUnity: yup.string().required(),
  email: yup.string().required().email(),
  privateKeyType: yup.string().required()
})
```

### Private Key Types
- `RSA (2048)`, `RSA (4096)`
- `ECDSA P-256`, `ECDSA P-384`

---

## 5. Data-TestIDs

### General
- `digital-certificate__name-field`
- `digital-certificate-create-form__certificate-type`

### Certificate Import
- `import-server-certificate-form__certificate-field`
- `import-server-certificate-form__private-key-field`

### CSR Generation
- `digital-certificate__subject-name-field`
- `digital-certificate__country`
- `digital-certificate__state`
- `digital-certificate__city`
- `digital-certificate__organization`
- `digital-certificate__organization-unit`
- `digital-certificate__email`
- `digital-certificate__san`

### Edit Form
- `digital-certificate__csr`
- `digital-certificate__copy-csr__button`
- `digital-certificate__copy-csr__message`
- `trusted-certificates-form__certificate-field`

### Menu
- `create_Certificate Manager_button`

---

## 6. Routes

| Path | Name | Component |
|------|------|-----------|
| `/digital-certificates` | `list-digital-certificates` | ListView.vue |
| `/digital-certificates/create` | `create-digital-certificates` | CreateView.vue |
| `/digital-certificates/edit/:id` | `edit-digital-certificates` | EditView.vue |

### Query Parameters
- `certificate=edge_certificate`
- `certificate=generateCSR`
- `certificate=trusted_ca_certificate`
- `certificate=certificateRevogationList`

---

## 7. Test Scenarios

### CREATE Operations
1. **Create Edge Certificate (Import)** - Upload certificate + private key
2. **Create Edge Certificate (CSR)** - Generate CSR with all fields
3. **Create Trusted CA** - Upload certificate only
4. **Create CRL** - Upload CRL

### READ Operations
5. **List Certificates** - Columns: ID, Name, Subject, Issuer, Type, Expiration, Status, Managed
6. **List CRL** - Filter to CRL only
7. **Load Certificate** - Verify all fields populated

### UPDATE Operations
8. **Update Edge Certificate** - Modify certificate/key
9. **Update CSR** - Add signed certificate
10. **Copy CSR** - Copy to clipboard

### DELETE Operations
11. **Delete Certificate** - Confirm deletion
12. **Delete CRL** - Confirm deletion

### VALIDATION
13. **CSR Fields** - All required, country 2-char, valid email
14. **Certificate Import** - Certificate + key required for edge
15. **Managed Certificate** - Cannot edit Let's Encrypt managed

### NAVIGATION
16. **Create Menu** - Server Cert, Trusted Cert, CRL options
17. **Drawer Mode** - Workload integration with emit events

---

## Certificate Status

| Status | Description |
|--------|-------------|
| Active | Certificate is valid and in use |
| Pending | Waiting for DNS verification (Let's Encrypt) |
| Inactive | Certificate not in use |
| Expired | Certificate has expired |
