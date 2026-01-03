# DataStream Module - Specification Catalog

## 1. Architecture Overview

| Component | Purpose |
|-----------|---------|
| `ListView.vue` | Display all data streams with filtering, sorting |
| `CreateView.vue` | Create new data streams with sampling dialog |
| `EditView.vue` | Edit existing data streams |
| `FormFieldsDataStream.vue` | Main form orchestrating all sections |
| `GeneralSection.vue` | Stream name field |
| `InputSection.vue` | Data source selection |
| `TransformSection.vue` | Domain filtering and sampling |
| `RenderTemplateSection.vue` | Template selection and preview |
| `OutputSection.vue` | Connector configuration |
| `StatusSection.vue` | Active/Inactive toggle |
| `Drawer/index.vue` | Create/Edit custom templates |
| `SamplingDialog.vue` | Sampling activation warning |

---

## 2. API Endpoints

### Streams: `v4/workspace/stream/streams`
| Method | Purpose |
|--------|---------|
| GET | List all data streams |
| GET `/{id}` | Load single stream |
| POST | Create new stream |
| PATCH `/{id}` | Update stream |
| DELETE `/{id}` | Delete stream |

### Templates: `v4/workspace/stream/templates`
| Method | Purpose |
|--------|---------|
| GET | List all templates |
| GET `/{id}` | Load template |
| POST | Create custom template |
| PATCH `/{id}` | Update template |
| DELETE `/{id}` | Delete template |

---

## 3. Toast Messages

| Action | Message |
|--------|---------|
| Create Stream | "Your data stream has been created" |
| Create Template | "Your custom template has been created" |
| Update Template | "Your custom template has been updated" |
| Edit Stream | "Your data stream has been updated" |
| Delete Stream | "Data Stream successfully deleted" |
| Delete Template | "Template successfully deleted" |

---

## 4. Validation Rules

### Required Fields
- `name`: String (required)
- `dataSource`: String (required) - Values: activity, http, functions, waf
- `template`: String (required)
- `domainOption`: String (required) - '1' (all) or '0' (filtered)
- `endpoint`: String (required) - Connector type

### Sampling Validation
```javascript
samplingPercentage: Required when hasSampling=true
  - Min: 0, Max: 100
```

### Connector-Specific Fields

**Standard**: endpointUrl, headers (Key:Value format), lineSeparator, payloadFormat, maxSize (min 1000000)

**Kafka**: bootstrapServers (max 150), kafkaTopic (max 150), useTls

**S3**: host (max 200), bucket (max 150), region (max 50), accessKey (max 150), secretKey (CREATE only), contentType

**BigQuery**: projectID, datasetID, tableID, serviceAccountKey

**Elasticsearch**: elasticsearchUrl, apiKey

**Splunk**: splunkUrl, splunkApiKey

**Kinesis**: streamName, awsRegion, awsAccessKey, awsSecretKey

**Datadog**: datadogUrl, datadogApiKey

**QRadar**: QRadarUrl

**Azure Monitor**: logType, sharedKey, workspaceID

**Azure Blob**: storageAccount, containerName, blobToken

---

## 5. Data-TestIDs

### Form Sections
- `data-stream-form__section__general`
- `data-stream-form__general__name-field`
- `data-stream-form__section__data-settings`
- `data-stream-form__data-settings__data-source-field`
- `data-stream-form__section__domains`
- `data-stream-form__domains__options-field`
- `data-stream-sampling-field`
- `data-stream-form__transform__sampling_rate`
- `data-stream-form__data-settings__template-field`
- `data-stream-form__data-settings__data-set-field`
- `data-stream-form__section__output`
- `data-stream-form__destination__connector-field`

### Output Fields (Standard)
- `data-stream-form__output__url-field`
- `data-stream-form__destination__payload-format-field`
- `data-stream-form__destination__payload-line-separator-field`
- `data-stream-form__destination__payload-max-size-field`
- `data-stream-form__destination__headers-field__input`

### Status
- `data-stream-form__section__status`
- `data-stream-form__status__status-field`

### Dialogs
- `data-stream-form__sampling__dialog`
- `data-stream-create-template-drawer`
- `data-stream-edit-template-drawer`

---

## 6. Routes

| Route | Path | Component |
|-------|------|-----------|
| List | `/data-stream` | ListView.vue |
| Create | `/data-stream/create` | CreateView.vue |
| Edit | `/data-stream/edit/:id` | EditView.vue |

### Route Guard
- `checkDomainsLimit`: Prevents create/edit if domains >= 3000

---

## 7. Test Scenarios

### CREATE Operations
1. **Create Stream** - Fill all sections, submit
2. **Create with Sampling** - Enable sampling, confirm dialog
3. **Create Custom Template** - Open drawer, fill name + dataSet
4. **Validate Connectors** - Test each connector type fields

### READ Operations
5. **List Streams** - Columns: ID, Name, Source, Template, Connector, Status
6. **Load Stream** - Verify all fields populated
7. **Permission Check** - View-only warning if no edit permission
8. **Domain Limit** - Warning if >= 3000 domains

### UPDATE Operations
9. **Edit Stream** - Modify fields, submit
10. **Edit Template** - Modify custom template
11. **Change Connector** - Switch connector type, validate new fields

### DELETE Operations
12. **Delete Stream** - Confirm deletion
13. **Delete Template** - Remove custom template

### VALIDATION
14. **URL Validation** - Invalid URL format error
15. **Header Validation** - Key:Value format required
16. **Sampling Range** - 0-100 range validation

---

## Connectors

| Type | Key Fields |
|------|------------|
| Standard | URL, Headers, Line Separator, Payload Format, Max Size |
| Kafka | Bootstrap Servers, Topic, TLS |
| S3 | Host, Bucket, Region, Access Key, Secret Key, Content Type |
| BigQuery | Project ID, Dataset ID, Table ID, Service Account Key |
| Elasticsearch | URL, API Key |
| Splunk | URL, API Key |
| Kinesis | Stream Name, Region, Access Key, Secret Key |
| Datadog | URL, API Key |
| QRadar | URL |
| Azure Monitor | Log Type, Shared Key, Workspace ID |
| Azure Blob | Storage Account, Container Name, Blob Token |
