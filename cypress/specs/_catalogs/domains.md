# Domains Module - Specification Catalog

## 1. Architecture Overview

### Main Files
- `CreateView.vue` - Domain creation form
- `EditView.vue` - Domain editing form
- `FormFieldsCreateDomains.vue` - Create form fields
- `FormFieldsEditDomains.vue` - Edit form fields (read-only domain)
- `CopyDomainDialog.vue` - Modal for copying generated domain

---

## 2. API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/domains` | Create domain |
| PATCH | `/domains/{id}` | Edit domain |
| GET | `/domains/{id}` | Load domain |

### Related Services
- `listEdgeApplicationsService()` - Application dropdown
- `listEdgeFirewallService()` - Firewall dropdown
- `digitalCertificatesService.listDigitalCertificatesDropdown()` - Certificates
- `digitalCertificatesService.createDigitalCertificateLetEncrypt()` - Auto Let's Encrypt

---

## 3. Toast Messages

| Action | Message |
|--------|---------|
| Domain Created | "Succesfully created!" + "The domain is now available..." |
| Domain Edited | "Your domain has been edited" |
| Copy Domain | "Successfully copied!" |
| Copy Failure | "The domain was not copied to the clipboard..." |

---

## 4. Validation Rules

### Create/Edit Schema
```javascript
yup.object({
  name: yup.string().required()
    .matches(/^[\x20-\x21\x23-\x7E]+$/, 'ASCII only'),
  edgeApplication: yup.number(),
  cnames: yup.string().required().when(['cnameAccessOnly', 'edgeCertificate', 'authorityCertificate']),
  cnameAccessOnly: yup.boolean(),
  edgeCertificate: yup.string(),
  authorityCertificate: yup.string().nullable(),
  mtlsIsEnabled: yup.boolean(),
  mtlsVerification: yup.string(),
  mtlsTrustedCertificate: yup.string().required().when('mtlsIsEnabled'),
  active: yup.boolean(),
  environment: yup.string()
})
```

---

## 5. Data-TestIDs

### Create Form Fields
- `domains-form__name-field`
- `domains-form__edge-application-field`
- `domains-form__create-edge-application-button`
- `domains-form__edge-firewall-field`
- `domains-form__create-edge-firewall-button`
- `domains-form__cname-access-only-field`
- `domains-form__cnames-field`
- `domains-form__edge-certificate-field`
- `domains-form__create-digital-certificate-button`
- `domains-form__mtls-is-enabled-field`
- `domains-form__mtls-trusted-certificate-field`
- `domains-form__active-field`

### Edit Form Fields
- `edit-domains-form__domain-field__input`
- `edit-domains-form__active-field`
- `domains-form__digital-certificates-field`

### Dialog
- `domains-view__copy-domain-dialog__header-title`
- `domains-dialog__domain-field__input`
- `domains-dialog__copy-domain__button`
- `domains-dialog__confirm__button`

---

## 6. Routes & Navigation

| Path | Name | Component |
|------|------|-----------|
| `/domains` | `list-domains` | Workload/ListView.vue |
| `/domains/create` | `create-domain` | CreateView.vue |
| `/domains/edit/:id` | `edit-domain` | EditView.vue |

### Redirects
- After creation: Dialog → Edit view → Toast
- After edit: Redirect to list-domains

---

## 7. Test Scenarios

### CREATE Operations
1. **Create Basic Domain** - Fill name, environment, application
2. **Create with CNAME Access Only** - Toggle, fill CNAME, certificate
3. **Create with mTLS** - Enable mTLS, select mode, Trusted CA
4. **Create with Let's Encrypt** - Select Let's Encrypt, fill CNAME
5. **Validation Errors** - Invalid characters, missing required fields

### EDIT Operations
6. **Load and Edit Domain** - Verify fields, modify, submit
7. **Environment Type Locked** - Field disabled with tooltip
8. **Copy Domain URL** - Read-only field with copy button
9. **Update mTLS Settings** - Enable/disable, change mode
10. **Update Firewall Association** - Clear/select firewall

### ERROR Handling
11. **API Errors on Create** - HTTP 409 duplicate, 400 validation
12. **API Errors on Edit** - Similar error handling
13. **Certificate Creation Failure** - Let's Encrypt fails

### DIALOG Operations
14. **Copy Domain Dialog** - Domain URL display, copy button, confirm

---

## Key Constants

| Constant | Value | Usage |
|----------|-------|-------|
| `EDGE_CERTIFICATE` | `'edge_certificate'` | Certificate filter |
| `TRUSTED_CA_CERTIFICATE` | `'trusted_ca_certificate'` | Trusted CA filter |
| `MTLS_VERIFICATION_ENFORCE` | `'enforce'` | Default mTLS mode |
