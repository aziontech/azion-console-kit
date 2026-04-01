# Button Component Migration Plan

## Context

This plan addresses the migration of button implementations in azion-console-kit to use reusable button components from `@aziontech/webkit`. The goal is to reduce code duplication, improve maintainability, and standardize button behavior across the application.

**Problem:** The codebase has 240+ button instances across 80+ files with repetitive patterns for Delete, Save, Cancel, Create, Copy, and Clone operations. While templates already provide good abstraction, many inline button implementations could benefit from componentization.

**Solution:** Migrate to reusable button components that follow the "dumb component" pattern - buttons only emit events, all business logic remains in the view layer.

---

## Current State Analysis

### Already Componentized ✅

1. **CopyBlock** - `@aziontech/webkit/copy-block`
   - Used in 85+ files
   - No migration needed

2. **ActionBarBlock** - `src/templates/action-bar-block`
   - Handles Save/Cancel button pair
   - Used in CreateView/EditView templates
   - Emits onSubmit and onCancel events
   - Props: loading, inDrawer, submitDisabled, primaryActionLabel, secondaryActionLabel

3. **DataTableActionsButtons** - `src/components/DataTable`
   - Create button with navigation
   - Props: size, label, createPagePath
   - Used in ListView pages

4. **Delete Pattern** - Actions array + useDeleteDialog composable
   - Templates handle UI, views provide service functions
   - Example: `actions = [{ type: 'delete', service, icon, label }]`

### Patterns to Migrate

#### Pattern 1: Action Arrays (ListView)

- **Current:** Views define actions array, templates handle rendering
- **Status:** Already optimal - NO MIGRATION NEEDED
- **Example:** EdgeDNS/ListView.vue lines 24-32

#### Pattern 2: ActionBarBlock Templates (CreateView/EditView)

- **Current:** Templates use PrimeButton internally
- **Migration:** Replace PrimeButton with ButtonSave/ButtonCancel in action-bar-block template
- **Impact:** Single file change affects all Create/Edit views

#### Pattern 3: Dialog Footer Buttons

- **Current:** Inline PrimeButton in dialog templates
- **Migration:** Replace with ButtonSave/ButtonCancel/ButtonDelete
- **Files:** Dialog components in `src/views/**/Dialog/`

#### Pattern 4: Drawer Footer Buttons

- **Current:** ActionBarBlock with inDrawer prop OR inline PrimeButton
- **Migration:** Replace with ButtonSave/ButtonCancel with inDrawer variant
- **Files:** Drawer components in `src/views/**/Drawer/`

#### Pattern 5: Specialized Button Implementations

- **Current:** Clone buttons, Refresh buttons, custom actions
- **Migration:** Evaluate case-by-case, may need ButtonClone component
- **Files:** EdgeApplications/ListView.vue (Clone), various ListView files (Refresh)

---

## Migration Strategy

### Phase 1: ActionBarBlock Template Migration (HIGH IMPACT)

**Rationale:** Single file change affects 43+ Create/Edit views

**File:** `src/templates/action-bar-block/index.vue`

**Current Implementation:**
```vue
<PrimeButton
  :label="primaryActionLabel"
  severity="primary"
  :icon="calculateLoadIconByLoadingState"
  :disabled="isDisabledSubmit"
  @click="handleSubmit"
/>
<PrimeButton
  :label="secondaryActionLabel"
  severity="secondary"
  outlined
  :disabled="isDisabledCancel"
  @click="handleCancel"
/>
```

**Migration:**
```vue
<ButtonSave
  :label="primaryActionLabel"
  :loading="loading"
  :disabled="submitDisabled"
  @save="handleSubmit"
/>
<ButtonCancel
  :label="secondaryActionLabel"
  :disabled="cancelDisabled"
  @cancel="handleCancel"
/>
```

**Changes Required:**
- Import ButtonSave and ButtonCancel from `@aziontech/webkit`
- Remove computed calculateLoadIconByLoadingState (handled by ButtonSave)
- Remove computed isDisabledSubmit and isDisabledCancel (handled by components)
- Change emit from 'onSubmit' to 'save' and 'onCancel' to 'cancel'
- Update all consuming views to use new event names

**Consuming Files (43+ views):**

All files using ActionBarTemplate or ActionBarBlock need event name updates:
- Change `@onSubmit="handler"` to `@save="handler"`
- Change `@onCancel="handler"` to `@cancel="handler"`

**Files to Update:**
- `src/templates/action-bar-block/action-bar-with-teleport.vue` (wrapper, also needs updates)
- All CreateView files (21 files)
- All EditView files (22 files)
- Various other templates using action-bar-block

**Verification:**
- Test CreateView pages: EdgeDNS/CreateView, EdgeApplications/CreateView
- Test EditView pages: EdgeDNS/EditView, Domains/EditView
- Verify loading states, disabled states, form submission
- Check inDrawer styling still works

---

### Phase 2: Dialog Button Migration (MEDIUM IMPACT)

**Files to Migrate:**
1. EdgeNode/Dialog/Unbind.vue - Delete + Cancel buttons
2. EdgeSQL/Dialog/AlterColumn.vue - Save + Cancel buttons
3. EdgeServices/Dialog/EdgeServicesToggleStatus.vue - Save + Cancel buttons
4. AccountSettings/FormFields/FormFieldsAccountSettings.vue - Delete button

**Pattern:**
```vue
<!-- Current -->
<PrimeButton label="Save" severity="secondary" @click="saveRules()" />
<PrimeButton label="Cancel" outlined @click="closeDialog()" />

<!-- Migration -->
<ButtonSave @save="saveRules" />
<ButtonCancel @cancel="closeDialog" />
```

**Dependencies to Keep in View Layer:**
- dialogRef for closing dialogs
- Service calls (API operations)
- Toast notifications
- Form validation state

**Changes Required:**
- Import ButtonSave, ButtonCancel, ButtonDelete from `@aziontech/webkit`
- Replace PrimeButton instances
- Keep event handlers in view layer

**Verification:**
- Test each dialog opens/closes correctly
- Verify API calls still work
- Check toast notifications appear
- Ensure form validation integration

---

### Phase 3: Create Button Consolidation (MEDIUM IMPACT)

**Current State:** DataTableActionsButtons already handles Create buttons in ListView pages

**Action:** NO MIGRATION NEEDED - Already optimal

**Files Using DataTableActionsButtons:**
- EdgeDNS/ListView.vue (line 113)
- EdgeApplications/ListView.vue (line 137)
- EdgeFirewall/ListView.vue (line 116)
- And 18+ other ListView files

**Verification:**
- Ensure DataTableActionsButtons uses ButtonCreate internally (future enhancement)
- Test navigation to create pages works
- Check analytics tracking fires correctly

---

### Phase 4: Delete Button Standardization (HIGH IMPACT)

**Current State:** Mixed patterns
- Pattern A: Actions array (optimal) - NO CHANGE
- Pattern B: Inline PrimeButton in dialogs/drawers - MIGRATE

**Files to Migrate:**
1. EdgeNode/Dialog/Unbind.vue (lines 80-88)
2. AccountSettings/FormFields/FormFieldsAccountSettings.vue (lines 524-529)

**Pattern:**
```vue
<!-- Current -->
<PrimeButton
  icon="pi pi-trash"
  label="Delete"
  severity="danger"
  outlined
  @click="openDeleteDialog"
/>

<!-- Migration -->
<ButtonDelete @click="openDeleteDialog" />
```

**Dependencies to Keep:**
- useDeleteDialog composable for confirmation flow
- Service functions for API calls
- Toast notifications
- Navigation after delete

**Architecture:** ButtonDelete emits 'click' event, view layer handles:
```javascript
// View layer
const openDeleteDialog = () => {
  showDeleteDialog.value = true
}

// Or use useDeleteDialog composable
const { openDialog, closeDialog } = useDeleteDialog({
  service: myDeleteService,
  onConfirm: () => { /* navigate, refresh, etc */ }
})
```

**Verification:**
- Test delete confirmation dialog appears
- Verify text input validation works (if applicable)
- Check service calls execute correctly
- Ensure toast notifications display
- Verify navigation/list refresh after delete

---

### Phase 5: ButtonClone Component Creation (LOW IMPACT)

**Files:** Only 3-4 files use Clone functionality
- EdgeApplications/ListView.vue (Clone in actions array)
- DigitalCertificates/ListView.vue
- WafRules/ListView.vue
- EdgeFirewall/ListView.vue

**Current Pattern:** Actions array with dialog component
```javascript
{
  type: 'dialog',
  label: 'Clone',
  icon: 'pi pi-fw pi-clone',
  dialog: {
    component: CloneBlock,
    body: (item) => ({
      data: {
        ...item,
        service: cloneService,
        itemType: 'Application',
        name: item.name.text
      }
    })
  }
}
```

**Action:** NO MIGRATION NEEDED - Already componentized via CloneBlock template

**Future Enhancement:** Create ButtonClone component for cases outside actions array

---

### Phase 6: Specialized Buttons (LOW PRIORITY)

#### Refresh Buttons:
- **Files:** Various ListView files
- **Pattern:** `<PrimeButton icon="pi pi-refresh" outlined size="small" @click="reload" />`
- **Action:** KEEP AS IS - Low reuse potential, business-specific logic

#### Split Buttons:
- **Files:** EdgeStorage/ListView.vue (lines 120-135)
- **Pattern:** SplitButton with dropdown menu
- **Action:** KEEP AS IS - Specialized component, not suitable for generic componentization

---

## Prerequisites

### Webkit Button Components Must Be Created First

**Status:** Button components do NOT exist in `@aziontech/webkit` yet

**Required Components:**
1. ButtonSave - `packages/webkit/src/components/buttons/ButtonSave.vue`
2. ButtonCancel - `packages/webkit/src/components/buttons/ButtonCancel.vue`
3. ButtonDelete - `packages/webkit/src/components/buttons/ButtonDelete.vue`
4. ButtonCreate - `packages/webkit/src/components/buttons/ButtonCreate.vue`
5. ButtonClone - `packages/webkit/src/components/buttons/ButtonClone.vue`

**Note:** ButtonCopy already exists as CopyBlock in `@aziontech/webkit/copy-block`

**Component Specifications:** See `relatorio-BUTTON-COMPONENTIZATION-COMPLETE-SPEC.md` for detailed specs

---

## Implementation Phases

### Week 0: Create Webkit Button Components (PREREQUISITE)

**Priority:** BLOCKING
**Impact:** Enables all subsequent phases

**Tasks:**
1. Create ButtonSave component in webkit (follow spec)
2. Create ButtonCancel component in webkit (follow spec)
3. Create ButtonDelete component in webkit (follow spec)
4. Create ButtonCreate component in webkit (follow spec)
5. Create ButtonClone component in webkit (follow spec)
6. Export all buttons from webkit index
7. Test components in Storybook
8. Publish new webkit version

---

### Week 1: ActionBarBlock Migration

**Priority:** HIGH
**Impact:** 43+ files benefit from single change

**Tasks:**
1. Update `src/templates/action-bar-block/index.vue` to use ButtonSave/ButtonCancel
2. Import components from `@aziontech/webkit`
3. Adjust event names (onSubmit → save, onCancel → cancel)
4. Update all consuming views to use new event names
5. Test on EdgeDNS/CreateView, EdgeDNS/EditView, EdgeApplications/CreateView

**Verification:**
- CreateView pages: Form submission works, loading states correct
- EditView pages: Save and Cancel work correctly
- Drawer views: inDrawer styling preserved
- Accessibility: aria-labels present, keyboard navigation works

---

### Week 2: Dialog Migration

**Priority:** MEDIUM
**Impact:** 4-6 dialog files

**Tasks:**
1. Migrate EdgeNode/Dialog/Unbind.vue
2. Migrate EdgeSQL/Dialog/AlterColumn.vue
3. Migrate EdgeServices/Dialog/EdgeServicesToggleStatus.vue
4. Migrate AccountSettings/FormFields/FormFieldsAccountSettings.vue
5. Test each dialog individually

**Verification:**
- Dialog opens/closes correctly
- API calls execute
- Toast notifications display
- Form state resets properly

---

### Week 3: Delete Button Migration

**Priority:** MEDIUM
**Impact:** 2-3 files with inline delete buttons

**Tasks:**
1. Migrate EdgeNode/Dialog/Unbind.vue delete button
2. Migrate AccountSettings delete button
3. Test delete confirmation flow
4. Verify service integration

**Verification:**
- Delete confirmation appears
- Text validation works (if applicable)
- API call executes
- Toast notification shows
- Navigation/list refresh works

---

### Week 4: Documentation & Cleanup

**Priority:** LOW
**Impact:** Developer experience

**Tasks:**
1. Document migration in resume-button-component-migration.md
2. Create usage examples for each button type
3. Document edge cases and dependencies
4. Create Storybook examples for webkit buttons
5. Update CLAUDE.md with button patterns
6. Record dependencies found during migration in resume-button-component-migration.md

---

## Dependencies Management

### Must Stay in View Layer

- **Vue Router** - useRouter, useRoute for navigation
- **Services** - API call functions from `@/services/v2/`
- **Toast** - useToast from PrimeVue
- **Dialog Management** - useDeleteDialog composable, dialogRef
- **Form Validation** - vee-validate + yup schemas
- **Analytics** - tracker injected dependency

### Moved to Components

- **Loading states** - Spinner icon management
- **Disabled states** - Logic for disabling during operations
- **Styling** - Severity, outlined, size consistency
- **Accessibility** - aria-labels, keyboard navigation
- **Icons** - Default icons for each button type

---

## Edge Cases & Special Implementations

### Case 1: Actions Array Pattern

- **Files:** All ListView files using list-table-block
- **Status:** NO CHANGE - Already optimal
- **Reason:** Template handles rendering, view provides configuration

### Case 2: DataTableActionsButtons

- **Files:** ListView files
- **Status:** NO CHANGE - Already componentized
- **Future:** Could use ButtonCreate internally

### Case 3: CopyBlock

- **Status:** ALREADY MIGRATED - Using `@aziontech/webkit/copy-block`
- **Action:** No Action Needed

### Case 4: Split Buttons

- **Files:** EdgeStorage/ListView.vue
- **Status:** KEEP AS IS
- **Reason:** Specialized pattern, low reuse potential

### Case 5: Refresh Buttons

- **Files:** Various ListView files
- **Status:** KEEP AS IS
- **Reason:** Business-specific, low reuse potential

---

## Testing Strategy

### Unit Testing

- Test each button component emits correct events
- Test loading state management
- Test disabled state logic
- Test accessibility attributes

### Integration Testing

- Test button in dialog context
- Test button in drawer context
- Test button in action bar context
- Test button with service calls

### Visual Regression Testing

- Compare before/after screenshots
- Test all severity variants (primary, secondary, danger)
- Test outlined vs filled variants
- Test loading spinner animation

### E2E Testing

Test complete user flows:
- Create entity (Save/Cancel)
- Edit entity (Save/Cancel)
- Delete entity (Delete confirmation)
- Copy value to clipboard
- Clone entity (Clone dialog)

---

## Verification Checklist

### Per File Migration

- [ ] Import correct button component from `@aziontech/webkit`
- [ ] Replace PrimeButton with Button[Type]
- [ ] Update event handler name (if needed)
- [ ] Remove redundant computed properties (loading icon, disabled logic)
- [ ] Keep service calls in view layer
- [ ] Keep router navigation in view layer
- [ ] Keep toast notifications in view layer
- [ ] Test button functionality
- [ ] Verify visual appearance matches original
- [ ] Check accessibility (aria-labels, keyboard nav)

### Per Button Type

- **ButtonSave** - Test in CreateView, EditView, Dialog
- **ButtonCancel** - Test navigation, form reset, drawer close
- **ButtonDelete** - Test confirmation dialog, service call, toast
- **ButtonCopy** - ALREADY DONE via CopyBlock
- **ButtonCreate** - Test navigation, analytics tracking
- **ButtonClone** - Test dialog, service call, validation

---

## Rollback Plan

### If Migration Fails

1. Revert commits to specific phase
2. Restore original PrimeButton imports
3. Restore original event names
4. Test original functionality

### Partial Rollback

- Can rollback per file if needed
- Can rollback per button type if needed
- Maintain git tags for each phase completion

---

## Success Metrics

### Code Reduction

- ActionBarBlock: ~30 lines removed
- Dialog files: ~15 lines per file removed
- Total: ~50-100 lines removed

### Developer Experience

- Consistent button behavior across app
- Easier to add new buttons
- Better accessibility by default
- Clearer separation of concerns

### Maintenance

- Single source of truth for button styles
- Easier to update button behavior
- Reduced code duplication
- Better test coverage

---

## Files by Migration Phase

### Phase 1: ActionBarBlock (Single File)

- `src/templates/action-bar-block/index.vue`

### Phase 2: Dialog Buttons (4-6 Files)

- `src/views/EdgeNode/Dialog/Unbind.vue`
- `src/views/EdgeSQL/Dialog/AlterColumn.vue`
- `src/views/EdgeServices/Dialog/EdgeServicesToggleStatus.vue`
- `src/views/AccountSettings/FormFields/FormFieldsAccountSettings.vue`

### Phase 3: Delete Buttons (2-3 Files)

- `src/views/EdgeNode/Dialog/Unbind.vue` (already in Phase 2)
- `src/views/AccountSettings/FormFields/FormFieldsAccountSettings.vue` (already in Phase 2)

### No Migration Needed (Already Optimal)

- All ListView files using actions array pattern
- All CreateView/EditView files using CreateFormBlock/EditFormBlock
- All files using DataTableActionsButtons
- All files using CopyBlock

---

## Dependencies to Document

During migration, the following dependencies must be documented in `resume-button-component-migration.md`:

### Vue Router Dependencies

**Pattern:** Buttons that navigate (Create, Cancel in some cases)
**Files:** All ListView, CreateView, EditView files

**Example:**
```javascript
// View layer - KEEP THIS
const router = useRouter()
const handleCreate = () => {
  router.push('/applications/new')
}
```

```vue
<!-- Component - ButtonCreate emits 'click', view handles navigation -->
<ButtonCreate label="Create Application" @click="handleCreate" />
```

### Service Dependencies

**Pattern:** Buttons that trigger API calls (Delete, Save, Clone)
**Files:** All files with delete/save/clone functionality

**Example:**
```javascript
// View layer - KEEP THIS
const handleDelete = async () => {
  await myService.delete(id)
  // toast, navigation, etc
}
```

```vue
<!-- Component - ButtonDelete emits 'click', view handles service -->
<ButtonDelete @click="handleDelete" />
```

### Dialog Management Dependencies

**Pattern:** Buttons that open/close dialogs
**Files:** Dialog components, drawer components

**Example:**
```javascript
// View layer - KEEP THIS
const dialogRef = inject('dialogRef')
const closeDialog = () => dialogRef.value.close()
```

```vue
<!-- Component - ButtonCancel emits 'cancel', view handles dialog -->
<ButtonCancel @cancel="closeDialog" />
```

### Toast Notification Dependencies

**Pattern:** Buttons that show feedback messages
**Files:** All files with success/error notifications

**Example:**
```javascript
// View layer - KEEP THIS
const toast = useToast()
const handleSave = async () => {
  try {
    await service.save(data)
    toast.add({ severity: 'success', summary: 'Saved!' })
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Failed' })
  }
}
```

```vue
<!-- Component - ButtonSave emits 'save', view handles toast -->
<ButtonSave @save="handleSave" />
```

### Form Validation Dependencies

**Pattern:** Buttons integrated with vee-validate forms
**Files:** CreateFormBlock, EditFormBlock templates

**Example:**
```vue
<!-- Template keeps validation logic -->
<CreateFormBlock :schema="validationSchema" :createService="service">
  <template #action-bar="{ onSubmit, onCancel, loading }">
    <ButtonSave :loading="loading" @save="onSubmit" />
    <ButtonCancel @cancel="onCancel" />
  </template>
</CreateFormBlock>
```

### Analytics Tracking Dependencies

**Pattern:** Buttons with tracking events
**Files:** Most ListView, CreateView, EditView files

**Example:**
```javascript
// View layer - KEEP THIS
const tracker = inject('tracker')
const handleCreate = () => {
  tracker.product.clickToCreate({ productName: 'Edge DNS' })
  router.push('/dns/new')
}
```

```vue
<!-- Component - ButtonCreate emits 'click', view handles tracking -->
<ButtonCreate label="Create Zone" @click="handleCreate" />
```

---

## What Cannot Be Migrated

### Actions Array Pattern (ListView)

**Reason:** Already optimal - template handles rendering
**Files:** All ListView files using list-table-block

**Example:**
```javascript
const actions = [
  { type: 'delete', label: 'Delete', service: myService.delete }
]
```

**Status:** NO CHANGE - This pattern already separates configuration (view) from rendering (template)

### DataTableActionsButtons Component

**Reason:** Already componentized
**Files:** ListView pages with Create button

**Example:**
```vue
<DataTableActionsButtons
  label="Zone"
  createPagePath="/dns/new"
  @click="handleTrackEvent"
/>
```

**Status:** NO CHANGE - Could use ButtonCreate internally in future

### SplitButton Pattern

**Reason:** Specialized component with low reuse
**Files:** EdgeStorage/ListView.vue
**Status:** KEEP AS IS

### Refresh/Reload Buttons

**Reason:** Business-specific logic, low reuse potential
**Files:** Various ListView files
**Status:** KEEP AS IS

---

## Conclusion

This migration plan focuses on high-impact, low-risk changes that improve code quality without disrupting functionality. The strategy:

1. **Leverages existing abstractions** - Most patterns are already well-abstracted via templates
2. **Maintains business logic separation** - All dependencies stay in view layer
3. **Preserves visual consistency** - Buttons maintain same appearance
4. **Improves maintainability** - Single source of truth for button behavior
5. **Enables gradual migration** - Can be done in phases with rollback capability

The primary benefit comes from Phase 1 (ActionBarBlock), which improves 43+ views with a single file change. Subsequent phases provide incremental improvements to specific components.
