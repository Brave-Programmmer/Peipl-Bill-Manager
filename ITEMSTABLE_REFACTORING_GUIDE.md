# ItemsTable Refactoring Guide

## Overview
This guide explains the new custom hooks and utilities created to improve ItemsTable organization, performance, and reliability.

## New Hooks Created

### 1. **useBillData** (`src/hooks/useBillData.js`)
Manages bill data state with helper functions for common operations.

**Usage:**
```javascript
import { useBillData } from '../hooks/useBillData';

// In component
const {
  billData,
  setBillData,
  updateItemAtIndex,
  updateColumn,
  addItems,
  deleteItem,
  deleteColumn,
  reorderItems,
  reorderColumns
} = useBillData(initialData);

// Update a cell
updateItemAtIndex(rowIdx, 'description', 'New value', calculateRowFormulas);

// Delete item
deleteItem(0);

// Reorder items (drag-drop)
reorderItems(fromIdx, toIdx);
```

**Benefits:**
- Centralized state management
- Reusable update functions
- Consistent data manipulation patterns
- Reduced boilerplate in main component

---

### 2. **useFormulaValidation** (`src/hooks/useFormulaValidation.js`)
Validates formula expressions before saving.

**Usage:**
```javascript
import { useFormulaValidation } from '../hooks/useFormulaValidation';

const { validateFormula } = useFormulaValidation(math);

// Validate formula
const result = validateFormula('quantity*rate', ['quantity', 'rate', 'amount']);

if (result.valid) {
  // Save formula
} else {
  toast.error(result.error);
}
```

**Features:**
- Validates formula syntax
- Checks for unknown column references
- Prevents forbidden characters
- Detailed error messages

---

### 3. **useUndoRedo** (`src/hooks/useUndoRedo.js`)
Implements undo/redo functionality with state history.

**Usage:**
```javascript
import { useUndoRedo } from '../hooks/useUndoRedo';

const {
  currentState,
  pushState,
  undo,
  redo,
  reset,
  canUndo,
  canRedo
} = useUndoRedo(initialState);

// When state changes
pushState(newState);

// Undo/Redo
undo();
redo();

// Check if available
{canUndo && <button onClick={undo}>Undo</button>}
{canRedo && <button onClick={redo}>Redo</button>}
```

**Features:**
- 50-state history limit (memory efficient)
- Maintains redo branch correctly
- Reset functionality
- Can check if undo/redo available

---

### 4. **useAutoSave** (`src/hooks/useAutoSave.js`)
Automatically saves bill data to localStorage with debouncing.

**Usage:**
```javascript
import { useAutoSave } from '../hooks/useAutoSave';

const {
  lastSaved,
  hasUnsavedChanges,
  getSavedData,
  clearSavedData,
  hasSavedData
} = useAutoSave(billData, true);

// Check for recovery data
if (hasSavedData()) {
  const recovered = getSavedData();
  // Restore data
}

// Clear saved data after restore
clearSavedData();
```

**Features:**
- 1-second debounce prevents excessive saves
- Tracks unsaved changes
- Can recover data from localStorage
- Error handling and logging

---

### 5. **useTableNavigation** (`src/hooks/useTableNavigation.js`)
Enhanced keyboard navigation with arrow keys and Tab support.

**Usage:**
```javascript
import { useTableNavigation } from '../hooks/useTableNavigation';

const {
  focusedCell,
  setFocus,
  resetFocus
} = useTableNavigation(itemsLength, columnsLength, true);

// Use focusedCell to highlight cells
if (focusedCell.row === rowIdx && focusedCell.col === colIdx) {
  // Highlight this cell
}

// Manually set focus
setFocus(2, 3);
```

**Supported Keys:**
- `Arrow Up/Down` - Move between rows
- `Arrow Left/Right` - Move between columns
- `Tab` - Move right, Shift+Tab move left
- Auto-wraps edges

---

## New Utility Components

### 6. **TableErrorBoundary** (`src/components/TableErrorBoundary.js`)

**Components:**
- `TableErrorBoundary` - Catches errors and displays recovery UI
- `DataRecoveryModal` - Modal for recovering unsaved data
- `LoadingIndicator` - Shows loading state

**Usage:**
```javascript
import { 
  TableErrorBoundary, 
  DataRecoveryModal, 
  LoadingIndicator 
} from '../components/TableErrorBoundary';

// Wrap component
<TableErrorBoundary onError={handleError}>
  <ItemsTable {...props} />
</TableErrorBoundary>

// Use recovery modal
<DataRecoveryModal
  isVisible={showRecovery}
  onRecover={handleRecover}
  onDiscard={handleDiscard}
  savedTime={lastSavedTime}
/>

// Show loading
<LoadingIndicator isVisible={isLoading} message="Saving..." />
```

---

### 7. **Utility Functions** (`src/utils/billDataUtils.js`)

#### BillDataValidator
Validates bill data structure and content.

```javascript
import { BillDataValidator } from '../utils/billDataUtils';

// Validate entire bill
const validation = BillDataValidator.validateBillData(billData);
if (!validation.valid) {
  console.error(validation.errors);
}

// Validate single item
const itemValidation = BillDataValidator.validateItem(item, columns);

// Validate column
const colValidation = BillDataValidator.validateColumn(column);

// Safe merge
const result = BillDataValidator.safeMergeBillData(current, updates);
```

#### Safe State Updater
```javascript
import { createSafeSetBillData } from '../utils/billDataUtils';

const safeSetBillData = createSafeSetBillData(setBillData, handleError);

// Use like setState but with validation
safeSetBillData(prev => ({
  ...prev,
  items: newItems
}));
```

#### Debounced Updates
```javascript
import { createDebouncedUpdate } from '../utils/billDataUtils';

const debouncedUpdate = createDebouncedUpdate((field, value) => {
  // Update only triggers after 300ms of inactivity
  updateField(field, value);
}, 300);

debouncedUpdate('description', 'new value');
```

---

## Integration Steps

### Step 1: Add Imports to ItemsTable
```javascript
import { useBillData } from '../hooks/useBillData';
import { useFormulaValidation } from '../hooks/useFormulaValidation';
import { useAutoSave } from '../hooks/useAutoSave';
import { useTableNavigation } from '../hooks/useTableNavigation';
import { TableErrorBoundary, DataRecoveryModal, LoadingIndicator } from '../components/TableErrorBoundary';
import { createSafeSetBillData, BillDataValidator } from '../utils/billDataUtils';
```

### Step 2: Replace Bill Data Management
```javascript
// Remove old state management
// const [billData, setBillData] = useState(...);

// Add new hooks
const {
  billData,
  setBillData,
  updateItemAtIndex,
  updateColumn,
  deleteItem,
  deleteColumn,
  reorderItems,
  reorderColumns
} = useBillData(initialBillData);

// Add auto-save
const { 
  hasSavedData, 
  getSavedData, 
  clearSavedData 
} = useAutoSave(billData, true);

// Add recovery modal
useEffect(() => {
  if (hasSavedData() && !billData?.items?.length) {
    setShowRecovery(true);
  }
}, []);

const handleRecover = () => {
  const saved = getSavedData();
  setBillData(saved);
  setShowRecovery(false);
};
```

### Step 3: Add Keyboard Navigation
```javascript
const { focusedCell } = useTableNavigation(
  items?.length || 0,
  columns?.length || 0,
  true
);

// Use in render
<td className={focusedCell.row === rowIdx && focusedCell.col === colIdx ? 'ring-2 ring-blue-500' : ''}>
  {/* Cell content */}
</td>
```

### Step 4: Wrap Component with Error Boundary
```javascript
export default function ItemsTableWrapper(props) {
  return (
    <TableErrorBoundary>
      <ItemsTable {...props} />
    </TableErrorBoundary>
  );
}
```

---

## Performance Improvements

### Memoization
The hooks are already optimized with `useCallback` to prevent unnecessary recreations.

### Validation
Data is validated before updates, preventing invalid states.

### Debouncing
Auto-save uses 1-second debounce to reduce localStorage writes.

### Memory Management
- Undo/redo limited to 50 states
- Old saves cleared when not needed

---

## Testing Recommendations

1. **useBillData**: Test all CRUD operations
2. **useFormulaValidation**: Test valid/invalid formulas
3. **useUndoRedo**: Test undo/redo sequences
4. **useAutoSave**: Check localStorage, test recovery
5. **useTableNavigation**: Test all arrow keys and Tab
6. **Error handling**: Intentionally cause errors to test boundary
7. **Recovery modal**: Test save/restore workflow

---

## Migration Checklist

- [ ] Create new hook files
- [ ] Create utility components
- [ ] Add imports to ItemsTable
- [ ] Replace state management
- [ ] Add auto-save functionality
- [ ] Add keyboard navigation
- [ ] Add error boundary
- [ ] Add recovery modal
- [ ] Test all functionality
- [ ] Update prop signatures
- [ ] Document changes

---

## Future Enhancements

1. **Conflict Resolution**: Handle concurrent edits
2. **Compression**: Compress large bill data in storage
3. **Encryption**: Encrypt sensitive data in localStorage
4. **Sync**: Sync with server when available
5. **Analytics**: Track user interactions
6. **Performance**: Further optimize large tables

---

## Troubleshooting

**Undo/Redo not working:**
- Check that `pushState` is called after each state change
- Verify hook is properly exported

**Auto-save not working:**
- Check browser's localStorage is enabled
- Verify `useAutoSave` hook is initialized
- Check browser console for errors

**Recovery modal not showing:**
- Verify `hasSavedData()` returns true
- Check that recovery modal is rendered

**Navigation keys not working:**
- Ensure `useTableNavigation` is enabled
- Check for other event listeners preventing default
- Verify hook has correct dimensions

---

**Created**: January 14, 2026  
**Status**: Complete  
**Version**: 1.0  
