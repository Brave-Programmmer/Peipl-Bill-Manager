"use client";
import React from "react";
import {
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
  useEffect,
} from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import toast from "react-hot-toast";
import { create, all } from "mathjs";
import styles from "../styles/ItemsTable.module.css";

const math = create(all, { number: "number" });

const LONG_TEXT_FIELD_REGEX = /(description|detail|note|remark|scope|work)/i;
const isLongTextColumn = (column = {}) => {
  const key = (column.key || "").toLowerCase();
  const label = (column.label || "").toLowerCase();
  return LONG_TEXT_FIELD_REGEX.test(key) || LONG_TEXT_FIELD_REGEX.test(label);
};

export default function ItemsTable({
  billData,
  setBillData,
  compact = false,
  toggleFullscreen,
  isFullscreen,
}) {
  // Dynamic columns/rows state in billData
  const defaultColumns = [
    { key: "srNoDate", label: "Sr. No. & Date", type: "text" },
    { key: "refNo", label: "Ref No.", type: "text" },
    { key: "description", label: "Job Description", type: "text" },
    { key: "sacHsn", label: "SAC/HSN", type: "text" },
    { key: "quantity", label: "Qty", type: "number" },
    { key: "rate", label: "Rate (₹)", type: "number" },
    {
      key: "amount",
      label: "Taxable Value (₹)",
      type: "formula",
      formula: "quantity*rate",
    },
    {
      key: "cgstAmount",
      label: "CGST (9%)",
      type: "formula",
      formula: "amount*0.09",
    },
    {
      key: "sgstAmount",
      label: "SGST (9%)",
      type: "formula",
      formula: "amount*0.09",
    },
    {
      key: "totalWithGST",
      label: "Total (₹)",
      type: "formula",
      formula: "amount+cgstAmount+sgstAmount",
    },
  ];

  const columns = billData.columns || defaultColumns;
  const items = billData.items || [];
  // Table title
  const tableTitle = billData.tableTitle || "Invoice";
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [showAddWhereModal, setShowAddWhereModal] = useState(false);
  const [addWhereOption, setAddWhereOption] = useState("current");
  const [addSpecificPage, setAddSpecificPage] = useState(1);
  const [showDateModal, setShowDateModal] = useState(null);
  // Presets (saved column + title configurations) stored in localStorage
  const [presets, setPresets] = useState(() => {
    try {
      const raw =
        typeof window !== "undefined" && localStorage.getItem("bill_presets");
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      return [];
    }
  });
  const [showPresets, setShowPresets] = useState(false);
  const [presetName, setPresetName] = useState("");

  // Bill Format Presets (complete bill structure) stored in localStorage
  const [billFormatPresets, setBillFormatPresets] = useState(() => {
    try {
      const raw =
        typeof window !== "undefined" &&
        localStorage.getItem("bill_format_presets");
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      return [];
    }
  });
  const [showBillFormatPresets, setShowBillFormatPresets] = useState(false);
  const [billFormatPresetName, setBillFormatPresetName] = useState("");
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  // Print width preset: 'narrow' | 'default' | 'wide'
  const [printWidthPreset, setPrintWidthPreset] = useState("default");

  const computedPrintWidth =
    printWidthPreset === "narrow"
      ? "160mm"
      : printWidthPreset === "wide"
      ? "186mm"
      : "170mm";
  const [showBulkAddModal, setShowBulkAddModal] = useState(false);
  const [bulkAddCount, setBulkAddCount] = useState(1);

  // Pagination state - configurable rows per page
  const rowsPerPage =
    (billData.rowsPerPage && Number(billData.rowsPerPage)) || 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [manualExtraPages, setManualExtraPages] = useState(0);

  // Keep manualExtraPages in sync with billData.manualExtraPages
  useEffect(() => {
    setManualExtraPages(billData.manualExtraPages || 0);
  }, [billData.manualExtraPages]);

  // ESC key to exit fullscreen
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === "Escape" && isFullscreen) {
        toggleFullscreen();
      }
    };

    window.addEventListener("keydown", handleEscKey);
    return () => window.removeEventListener("keydown", handleEscKey);
  }, [isFullscreen, toggleFullscreen]);
  const basePages = Math.max(1, Math.ceil((items || []).length / rowsPerPage));
  const totalPages = Math.max(1, basePages + (manualExtraPages || 0));

  const addDateToItem = useCallback(
    (itemId) => {
      const currentDate =
        billData.date || new Date().toISOString().split("T")[0];

      setBillData((prev) => ({
        ...prev,
        items: prev.items.map((item) => {
          if (item.id === itemId) {
            const currentDates = item.dates || [currentDate];
            // Only add if date doesn't already exist
            if (!currentDates.includes(currentDate)) {
              return {
                ...item,
                dates: [...currentDates, currentDate],
              };
            }
          }
          return item;
        }),
      }));
      setShowDateModal(null);
    },
    [billData.date],
  );

  // Ensure every item has a stable id to prevent React remounts which can cause input focus loss
  useLayoutEffect(() => {
    if (!billData?.items || billData.items.length === 0) return;
    const missing = billData.items.some(
      (it) =>
        !it || typeof it.id === "undefined" || it.id === null || it.id === "",
    );
    if (missing) {
      setBillData((prev) => ({
        ...prev,
        items: (prev.items || []).map((it) => ({
          ...(it || {}),
          id: it && it.id ? it.id : generateUniqueId(),
        })),
      }));
    }
    // only run when items length or references change
  }, [billData.items, generateUniqueId, setBillData]);

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  // Column type modal state
  const [showColTypeModal, setShowColTypeModal] = useState(false);
  const [pendingCol, setPendingCol] = useState(null);
  const columnTypes = [
    { value: "text", label: "Text" },
    { value: "number", label: "Number" },
    { value: "date", label: "Date" },
    { value: "formula", label: "Formula" },
  ];

  // Precompile formula expressions to improve performance
  const compiledFormulas = useMemo(() => {
    const map = {};
    (columns || []).forEach((c) => {
      if (c.type === "formula" && c.formula) {
        try {
          map[c.key] = math.compile(c.formula);
        } catch (err) {
          console.debug("Failed to compile formula for", c.key, err);
        }
      }
    });
    return map;
  }, [columns]);
  const [newColType, setNewColType] = useState("text");
  const [newColFormula, setNewColFormula] = useState("");
  const [newColLabel, setNewColLabel] = useState("");
  const [formulaError, setFormulaError] = useState(null);
  const [isFormulaValid, setIsFormulaValid] = useState(true);
  const [newColScope, setNewColScope] = useState("current");
  const [newColSpecificPage, setNewColSpecificPage] = useState(1);
  // Editing is handled locally inside the EditableCell component using useState.

  // Formula validator using mathjs to parse expressions and ensure referenced columns exist
  const validateFormula = useCallback((formula, availableCols) => {
    if (!formula || !formula.trim())
      return { valid: false, error: "Formula cannot be empty" };

    // Quick forbidden chars check (disallow semicolon to avoid statements)
    if (/[;\[\]{}]/.test(formula))
      return { valid: false, error: "Formula contains invalid characters" };

    // Try parse with mathjs
    try {
      const node = math.parse(formula);
      // collect symbol nodes
      const symbols = [];
      node.traverse(function (n) {
        if (n.isSymbolNode) symbols.push(n.name);
      });
      const unknown = symbols.filter(
        (s) => !availableCols.includes(s) && isNaN(Number(s)),
      );
      if (unknown.length > 0)
        return {
          valid: false,
          error: `Unknown column keys: ${[...new Set(unknown)].join(", ")}`,
        };
      // also try compile to catch other errors
      node.compile();
    } catch (err) {
      return { valid: false, error: `Formula error: ${err.message}` };
    }

    return { valid: true };
  }, []);

  // Re-validate formula when modal opens or formula/type/columns change
  useEffect(() => {
    if (!showColTypeModal) return;
    if (newColType !== "formula") {
      setIsFormulaValid(true);
      setFormulaError(null);
      return;
    }
    const available = columns.map((c) => c.key);
    const res = validateFormula(newColFormula, available);
    setIsFormulaValid(res.valid);
    setFormulaError(res.valid ? null : res.error);
  }, [showColTypeModal, newColFormula, newColType, columns, validateFormula]);

  // Column modal save handler will either update an existing column or add a new one.
  function savePendingColumn() {
    if (!pendingCol) return;
    const idx = pendingCol.idx;
    const isNew = pendingCol.col == null;
    const keyBase = `col${columns.length + 1}`;
    const newKey = isNew
      ? `${keyBase}-${Date.now().toString(36)}`
      : pendingCol.col.key;
    const newCol = {
      key: newKey,
      label: pendingCol.col
        ? pendingCol.col.label
        : `Column ${columns.length + 1}`,
      type: newColType || "text",
      formula: newColType === "formula" ? newColFormula : undefined,
    };

    setBillData((prev) => {
      const prevCols = prev.columns || defaultColumns;
      // If editing existing column
      if (!isNew) {
        const updatedCols = prevCols.map((c) =>
          c.key === pendingCol.col.key ? { ...c, ...newCol } : c,
        );
        // If formula changed, recalc all rows
        const newItems = (prev.items || []).map((it) =>
          calculateRowFormulas(it),
        );
        return { ...prev, columns: updatedCols, items: newItems };
      }

      // Adding a new column: insert at the end (or at idx)
      const insertedCols = [...prevCols, newCol];
      const items = [...(prev.items || [])];

      // helper to add key to a range
      const addKeyRange = (startIdx, endIdx) => {
        // determine sensible default for the new column value
        const defaultValue =
          newCol.key === "quantity" ||
          (newCol.type === "number" &&
            (String(newCol.label || "")
              .toLowerCase()
              .includes("qty") ||
              String(newCol.label || "")
                .toLowerCase()
                .includes("quantity")))
            ? "1"
            : "";
        for (let i = startIdx; i < endIdx && i < items.length; i++) {
          items[i] = calculateRowFormulas({
            ...(items[i] || {}),
            [newKey]: defaultValue,
          });
        }
      };

      if (newColScope === "all") {
        // add to every existing row
        const defaultValue =
          newCol.key === "quantity" ||
          (newCol.type === "number" &&
            (String(newCol.label || "")
              .toLowerCase()
              .includes("qty") ||
              String(newCol.label || "")
                .toLowerCase()
                .includes("quantity")))
            ? "1"
            : "";
        for (let i = 0; i < items.length; i++) {
          items[i] = calculateRowFormulas({
            ...(items[i] || {}),
            [newKey]: defaultValue,
          });
        }
      } else if (newColScope === "specific") {
        const p = Math.min(
          Math.max(1, newColSpecificPage || currentPage),
          Math.max(1, Math.ceil(items.length / rowsPerPage) || 1),
        );
        const s = (p - 1) * rowsPerPage;
        addKeyRange(s, s + rowsPerPage);
      } else {
        // default: current page
        const s = (currentPage - 1) * rowsPerPage;
        addKeyRange(s, s + rowsPerPage);
      }

      return { ...prev, columns: insertedCols, items };
    });

    // reset modal state
    setPendingCol(null);
    setNewColFormula("");
    setNewColType("text");
    setShowColTypeModal(false);
    toast.success(isNew ? "Column added to current page" : "Column updated");
  }

  // dnd-kit drag end handler for both rows and columns
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;
    // Row drag
    if (
      String(active.id).startsWith("row-") &&
      String(over.id).startsWith("row-")
    ) {
      const oldIndex = items.findIndex(
        (row, idx) => `row-${row.id || idx}` === active.id,
      );
      const newIndex = items.findIndex(
        (row, idx) => `row-${row.id || idx}` === over.id,
      );
      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(items, oldIndex, newIndex);
        setBillData((prev) => ({ ...prev, items: reordered }));
      }
    }
    // Column drag
    if (
      String(active.id).startsWith("col-") &&
      String(over.id).startsWith("col-")
    ) {
      const oldIndex = columns.findIndex(
        (col, idx) => `col-${col.key}` === active.id,
      );
      const newIndex = columns.findIndex(
        (col, idx) => `col-${col.key}` === over.id,
      );
      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(columns, oldIndex, newIndex);
        setBillData((prev) => ({ ...prev, columns: reordered }));
      }
    }
  };

  // Preset helpers: persist/load/save/delete presets in localStorage
  function persistPresets(list) {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("bill_presets", JSON.stringify(list || []));
      }
      setPresets(list || []);
    } catch (err) {
      console.error("Failed to persist presets", err);
    }
  }

  function savePreset(name) {
    const trimmed = (name || "").trim();
    if (!trimmed) {
      toast.error("Please provide a preset name");
      return;
    }
    const preset = {
      id: String(Date.now()),
      name: trimmed,
      columns: columns.map((c) => ({ ...c })),
      tableTitle: tableTitle,
    };
    const next = [preset, ...(presets || [])];
    persistPresets(next);
    toast.success("Preset saved");
    setPresetName("");
    setShowPresets(false);
  }
  function loadPreset(p) {
    if (!p) return;
    setBillData((prev) => {
      const newCols = p.columns || [];
      // adapt existing items so they have keys for new columns
      const newItems = (prev.items || []).map((it) => {
        const n = { ...it };
        newCols.forEach((c) => {
          if (!(c.key in n)) n[c.key] = c.key === "quantity" ? "1" : "";
        });
        return calculateRowFormulas(n);
      });
      return {
        ...prev,
        columns: newCols,
        tableTitle: p.tableTitle || prev.tableTitle,
        items: newItems,
      };
    });
    toast.success("Preset loaded");
    setShowPresets(false);
  }
  function deletePreset(id) {
    const next = (presets || []).filter((x) => x.id !== id);
    persistPresets(next);
    toast.success("Preset deleted");
  }
  // Bill Format Preset helpers: persist/load/save/delete complete bill format presets
  function persistBillFormatPresets(list) {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("bill_format_presets", JSON.stringify(list || []));
      }
      setBillFormatPresets(list || []);
    } catch (err) {
      console.error("Failed to persist bill format presets", err);
    }
  }
  function saveBillFormatPreset(name) {
    const trimmed = (name || "").trim();
    if (!trimmed) {
      toast.error("Please provide a preset name");
      return;
    }

    const preset = {
      id: String(Date.now()),
      name: trimmed,
      billData: {
        ...billData,
        columns: columns.map((c) => ({ ...c })),
        tableTitle: tableTitle,
        rowsPerPage: rowsPerPage,
        manualExtraPages: manualExtraPages,
      },
      savedAt: new Date().toISOString(),
      description: `Bill format with ${columns.length} columns: ${columns
        .map((c) => c.label)
        .join(", ")}`,
    };

    const next = [preset, ...(billFormatPresets || [])];
    persistBillFormatPresets(next);
    toast.success("Bill format preset saved");
    setBillFormatPresetName("");
    setShowBillFormatPresets(false);
  }
  function loadBillFormatPreset(p) {
    if (!p || !p.billData) return;

    // Load the complete bill data structure
    setBillData((prev) => ({
      ...prev,
      ...p.billData,
      // Reset items to default structure but keep the format
      items: p.billData.items || [
        {
          id: generateUniqueId(),
          description: "",
          sacHsn: "",
          quantity: 1,
          unit: "PCS",
          rate: 0,
          amount: 0,
          cgstRate: 9,
          cgstAmount: 0,
          sgstRate: 9,
          sgstAmount: 0,
          totalWithGST: 0,
          dates: [new Date().toISOString().split("T")[0]],
        },
      ],
    }));

    setCurrentPage(1);
    setManualExtraPages(p.billData.manualExtraPages || 0);
    toast.success("Bill format preset loaded");
    setShowBillFormatPresets(false);
  }
  function deleteBillFormatPreset(id) {
    const next = (billFormatPresets || []).filter((x) => x.id !== id);
    persistBillFormatPresets(next);
    toast.success("Bill format preset deleted");
  }
  // Memoize column totals for performance
  const columnTotals = useMemo(() => {
    const totals = {};
    columns.forEach((col) => {
      if (col.type === "number" || col.type === "formula") {
        let sum = 0;
        items.forEach((item) => {
          const v = item[col.key];
          if (Array.isArray(v)) {
            v.forEach((val) => {
              const num = Number(val);
              if (!isNaN(num)) sum += num;
            });
          } else {
            const num = Number(v);
            if (!isNaN(num)) sum += num;
          }
        });
        totals[col.key] = Number(sum.toFixed(2));
      }
    });
    return totals;
  }, [items, columns]);

  // Utility: generate a reasonably unique id
  function generateUniqueId() {
    return `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  // Safely convert a value to a number (handles strings, commas, empty, null, arrays)
  function toNumberSafe(v, defaultVal = 0) {
    if (v === "" || v == null || typeof v === "undefined") return defaultVal;
    if (Array.isArray(v)) return v.map((x) => toNumberSafe(x, defaultVal));
    // strip common thousands separators
    const cleaned = String(v).replace(/,/g, "").trim();
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : defaultVal;
  }
  // Format a number to a fixed number of decimals and return Number type
  function formatNumber(n, decimals = 2) {
    if (typeof n !== "number" || !Number.isFinite(n)) return 0;
    return Number(n.toFixed(decimals));
  }
  // Calculate formula columns for a single row (mutates and returns a new object)
  function calculateRowFormulas(row) {
    const r = { ...row };
    columns.forEach((col) => {
      if (col.type === "formula" && col.formula) {
        try {
          const compiled = compiledFormulas[col.key] || math.compile(col.formula);

          // collect lengths of any array-valued dependent columns
          const arrayLengths = columns
            .map((c) => (Array.isArray(r[c.key]) ? r[c.key].length : 0))
            .filter((len) => len > 0);

          // No array dependencies: single-value calculation
          if (arrayLengths.length === 0) {
            const scope = {};
            columns.forEach((c) => {
              const v = r[c.key];
              if (Array.isArray(v)) {
                scope[c.key] = toNumberSafe(v[0], 0);
              } else {
                scope[c.key] = toNumberSafe(v, 0);
              }
            });
            const val = compiled.evaluate(scope);
            r[col.key] = typeof val === "number" ? formatNumber(val, 2) : val;
          } else {
            // array dependencies exist — compute element-wise up to the shortest array
            // This ensures removing a value also removes the corresponding computed entry.
            const elemLen = Math.min(...arrayLengths);
            const results = new Array(elemLen);
            for (let i = 0; i < elemLen; i++) {
              const scope = {};
              columns.forEach((c) => {
                const v = r[c.key];
                if (Array.isArray(v)) {
                  scope[c.key] = toNumberSafe(v[i], 0);
                } else {
                  scope[c.key] = toNumberSafe(v, 0);
                }
              });
              const val = compiled.evaluate(scope);
              results[i] = typeof val === "number" ? formatNumber(val, 2) : val;
            }
            r[col.key] = results;
          }
        } catch (err) {
          // On formula errors, fall back to numeric-friendly defaults instead of throwing
          // If inputs suggest an array result, return an array of zeros; otherwise return 0
          const arrayLens = columns
            .map((c) => (Array.isArray(r[c.key]) ? r[c.key].length : 0))
            .filter((l) => l > 0);
          if (arrayLens.length > 0) {
            const maxL = Math.max(...arrayLens);
            r[col.key] = new Array(maxL).fill(0);
          } else {
            r[col.key] = 0;
          }
          // Log the error for debugging but avoid noisy console output in production
          // eslint-disable-next-line no-console
          console.warn(`Formula evaluation failed for column ${col.key}:`, err.message || err);
        }
      }
    });
    return r;
  }
  // Update item at numeric index (used by EditableCell commit)
  function updateItemAtIndex(rowIdx, field, value) {
    setBillData((prev) => {
      const items = [...(prev.items || [])];
      const target = items[rowIdx]
        ? { ...items[rowIdx], [field]: value }
        : { id: generateUniqueId(), [field]: value };
      items[rowIdx] = calculateRowFormulas(target);
      return { ...prev, items };
    });
  }

  // Normalize and calculate formulas for all items on mount to ensure formula arrays are present
  useEffect(() => {
    setBillData((prev) => {
      if (!prev || !Array.isArray(prev.items) || prev.items.length === 0)
        return prev;
      const nextItems = prev.items.map((it) => calculateRowFormulas(it));
      // Only update if different (shallow compare)
      const changed = nextItems.some(
        (n, i) => JSON.stringify(n) !== JSON.stringify(prev.items[i]),
      );
      return changed ? { ...prev, items: nextItems } : prev;
    });
    // run only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Update both local manualExtraPages and persist into billData so other components (print/generator) can read it
  function changeManualExtraPages(delta) {
    setManualExtraPages((prev) => {
      const next = Math.max(0, (prev || 0) + delta);
      // persist
      setBillData((b) => ({ ...(b || {}), manualExtraPages: next }));
      // clamp current page if needed
      const newTotal = Math.max(
        1,
        Math.ceil((items || []).length / rowsPerPage) + next,
      );
      setCurrentPage((p) => Math.min(p, newTotal));
      return next;
    });
  }

  // Open the add-row flow; if more than one page, ask where to add
  function openAddRowFlow() {
    if (totalPages > 1) {
      // default to current page
      setAddWhereOption("current");
      setAddSpecificPage(Math.min(Math.max(1, currentPage), totalPages));
      setShowAddWhereModal(true);
      return;
    }
    // single page -> just append to current behavior
    performAddRow("current");
  }

  // Insert new row depending on choice
  function performAddRow(option, specificPage = null) {
    setIsAddingItem(true);
    setBillData((prev) => {
      const items = [...(prev.items || [])];
      const newRow = { id: generateUniqueId() };
      columns.forEach((c) => {
        if (c.key === "quantity") newRow[c.key] = "1";
        else newRow[c.key] = "";
      });

      // Determine target page for insert
      let targetPage = currentPage;
      if (option === "specific" && specificPage)
        targetPage = Math.min(Math.max(1, specificPage), totalPages);
      else if (option === "last") targetPage = totalPages;
      else if (option === "new") targetPage = totalPages + 1;

      // If we're creating a new page, the insert index will be at the end
      let insertIndex = items.length;

      if (option === "new") {
        insertIndex = items.length;
      } else {
        // Insert into the chosen page: compute how many rows already exist on that page
        const start = (targetPage - 1) * rowsPerPage;
        const existingOnPage = Math.max(
          0,
          Math.min(rowsPerPage, items.slice(start, start + rowsPerPage).length),
        );
        insertIndex = start + existingOnPage;
      }

      // Make sure insertIndex doesn't exceed items length
      insertIndex = Math.min(insertIndex, items.length);

      items.splice(insertIndex, 0, calculateRowFormulas(newRow));

      return { ...prev, items };
    });

    // handle 'new' page creation after state mutation
    if (option === "new") {
      changeManualExtraPages(1);
      // move to the new last page
      setCurrentPage((prev) => Math.max(1, prev) + 1);
    }

    // navigate to specific page if requested
    if (option === "specific" && specificPage) {
      setCurrentPage(Math.min(Math.max(1, specificPage), totalPages));
    }

    // if option was 'current' ensure we're on that page
    if (option === "current") {
      setCurrentPage((p) => Math.min(Math.max(1, p), totalPages));
    }

    setShowAddWhereModal(false);
    setTimeout(() => setIsAddingItem(false), 200);
  }

  // dnd-kit sortable row component
  function SortableRow({ row, rowIdx, children }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({
      id: `row-${row.id || rowIdx}`,
    });
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      background: isDragging
        ? "linear-gradient(90deg, rgba(1, 155, 152, 0.1), rgba(1, 155, 152, 0.05))"
        : undefined,
      color: "#000",
      boxShadow: isDragging ? "0 12px 30px rgba(1, 155, 152, 0.2)" : undefined,
      userSelect: isDragging ? "none" : undefined,
      cursor: "grab",
    };
    return (
      <tr
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={`border-b border-gray-200 group transition-all duration-200 hover:bg-gradient-to-r hover:from-[#019b98]/03 hover:to-[#019b98]/02 ${
          isDragging ? "dragging-row dragging" : ""
        } ${rowIdx % 2 === 1 ? "bg-gray-50" : "bg-white"}`}
      >
        {children}
      </tr>
    );
  }

  function SortableColumn({ col, idx, children }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({
      id: `col-${col.key}`,
    });
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      background: isDragging
        ? "linear-gradient(135deg, #e6fcfa 0%, #d1fae5 100%)"
        : undefined,
      color: isDragging ? "#0a7a78" : "#000",
      boxShadow: isDragging ? "0 8px 20px rgba(1, 155, 152, 0.25)" : undefined,
      userSelect: isDragging ? "none" : undefined,
      borderColor: isDragging ? "#019b98" : undefined,
      cursor: "grab",
      minWidth: 80,
    };
    return (
      <th
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={`px-3 py-3 text-left font-bold border-b-2 border-gray-200 group ${
          isDragging ? "dragging-column dragging" : ""
        }`}
      >
        <div className="flex items-center gap-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="18"
            height="18"
            className={`${styles.dragHandle} icon-svg text-[#019b98]`}
            title="Drag to reorder"
            {...attributes}
            {...listeners}
            aria-hidden="true"
          >
            <path
              fill="currentColor"
              d="M3 7h18v2H3V7zm0 4h18v2H3v-2zm0 4h18v2H3v-2z"
            />
          </svg>
          {children}
          <span
            className="ml-1 text-xs px-1 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-500"
            title={`Type: ${col.type}${
              col.type === "formula" && col.formula ? ` (${col.formula})` : ""
            }`}
          >
            {col.type === "formula" ? "ƒ" : col.type?.[0]?.toUpperCase()}
          </span>
          <button
            onClick={() => {
              // Edit column type
              setPendingCol({ idx, col });
              setNewColType(col.type || "text");
              setNewColFormula(col.formula || "");
              setNewColLabel(col.label || "");
              setShowColTypeModal(true);
            }}
            className="ml-1 text-blue-400 hover:text-blue-600 bg-none border-none cursor-pointer font-bold text-base px-1 py-0.5 rounded transition-all"
            title="Edit column type"
            style={{
              background: "#f1f5f9",
              border: "1px solid black",
              padding: "0px 0px 5px 3px",
              color: "#000",
              boxShadow: "none",
              lineHeight: "20px",
            }}
          >
            <svg
              className="icon-svg"
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12.2 7.8l4 4M3 21l3.75-1 11.13-11.13a2.12 2.12 0 0 0-3-3L3 17.25V21z" />
            </svg>
          </button>
        </div>
      </th>
    );
  }

  // Small cell component that manages its own local state via useState
  function EditableCell({
    row,
    rowIdx,
    col,
    inputType,
    readOnly,
    displayValue,
  }) {
    // Multi-value support: if displayValue is an array, render multiple inputs
    const isArray = Array.isArray(displayValue);
    const isLongTextField = isLongTextColumn(col);
    const [localValues, setLocalValues] = useState(
      isArray
        ? displayValue.map((v) => String(v ?? ""))
        : [String(displayValue ?? "")],
    );
    useEffect(() => {
      if (isArray) {
        setLocalValues(displayValue.map((v) => String(v ?? "")));
      } else {
        setLocalValues([String(displayValue ?? "")]);
      }
    }, [displayValue, isArray]);

    // Modern input highlight state
    const [focusedIdx, setFocusedIdx] = useState(-1);
    // Use React refs for robust navigation
    const inputRefs = useMemo(
      () => localValues.map(() => React.createRef()),
      [localValues.length],
    );

    useEffect(() => {
      if (!isLongTextField) return;
      inputRefs.forEach((ref) => {
        if (ref.current) {
          ref.current.style.height = "auto";
          const maxHeight = 320;
          ref.current.style.height = `${Math.min(
            ref.current.scrollHeight,
            maxHeight,
          )}px`;
        }
      });
    }, [inputRefs, localValues, isLongTextField]);

    const commit = (idx = null) => {
      if (readOnly) return;
      let valuesToSave = localValues;
      if (inputType === "number") {
        valuesToSave = localValues.map((v) => {
          const numValue = parseFloat(v);
          return isNaN(numValue) ? 0 : numValue;
        });
      }
      let valueToSave =
        valuesToSave.length === 1 && !isArray ? valuesToSave[0] : valuesToSave;
      updateItemAtIndex(rowIdx, col.key, valueToSave);
    };

    const handleInputChange = (e, idx) => {
      const newValue = e.target.value;
      setLocalValues((prev) => {
        const arr = [...prev];
        arr[idx] = newValue;
        return arr;
      });
    };

    const handleAddValue = () => {
      setLocalValues((prev) => {
        const arr = [...prev, ""];
        // Persist the new array into billData so formulas recalc immediately
        let valueToSave = arr.length === 1 ? arr[0] : arr;
        if (inputType === "number") {
          const nums = arr.map((v) => {
            const n = parseFloat(v);
            return isNaN(n) ? 0 : n;
          });
          valueToSave = nums.length === 1 ? nums[0] : nums;
        }
        try {
          updateItemAtIndex(rowIdx, col.key, valueToSave);
        } catch (e) {
          // avoid breaking UI if update fails
          // eslint-disable-next-line no-console
          console.warn("Failed to persist added value:", e.message || e);
        }
        return arr;
      });
    };
    // Highlight the + button for refNo and rate columns
    const highlightAdd = col.key === "refNo" || col.key === "rate";
    const handleRemoveValue = (idx) => {
      setLocalValues((prev) => {
        const arr = prev.filter((_, i) => i !== idx);
        // Persist change across the whole item: remove index `idx` from any array-valued column
        setBillData((prevBill) => {
          const items = [...(prevBill.items || [])];
          const target = items[rowIdx] ? { ...items[rowIdx] } : { id: generateUniqueId() };

          // For every column, if the value is an array, remove element at idx
          columns.forEach((c) => {
            const val = target[c.key];
            if (Array.isArray(val)) {
              const newArr = val.filter((_, i) => i !== idx);
              // Normalize single-element arrays to scalar as earlier logic
              if (newArr.length === 0) target[c.key] = "";
              else if (newArr.length === 1) {
                // preserve numeric types for number columns
                target[c.key] = c.type === "number" ? toNumberSafe(newArr[0], 0) : newArr[0];
              } else {
                // For number columns, convert items to numbers
                target[c.key] = c.type === "number" ? newArr.map((v) => toNumberSafe(v, 0)) : newArr;
              }
            }
          });

          items[rowIdx] = calculateRowFormulas(target);
          return { ...prevBill, items };
        });

        // Update the cell-local values and return new array for UI
        return arr;
      });
    };

    // Input props helper
    const getInputProps = (idx) => {
      return {
        value: localValues[idx],
        onChange: (e) => handleInputChange(e, idx),
        onBlur: () => {
          commit(idx);
          setFocusedIdx(-1);
        },
        onFocus: () => setFocusedIdx(idx),
        onClick: (e) => {
          e.target.select?.();
          setFocusedIdx(idx);
        },
        onMouseDown: (e) => {
          if (readOnly) return;
          try {
            const ref = inputRefs[idx];
            if (ref && ref.current) {
              // focus on mouse down so single click begins editing
              ref.current.focus();
              ref.current.select?.();
              setFocusedIdx(idx);
            }
          } catch (err) {
            // ignore
          }
        },
        ref: inputRefs[idx],
        onKeyDown: (e) => {
          if (readOnly) return;
          // Helper: find next editable element in the same row
          function findNextEditable(currentEl, forward = true) {
            const td = currentEl?.closest("td");
            if (!td) return null;
            let nextTd = forward
              ? td.nextElementSibling
              : td.previousElementSibling;
            while (nextTd) {
              // Find first editable element: input, textarea, or [contenteditable]
              const editable = nextTd.querySelector(
                "input:not([readonly]), textarea:not([readonly]), [contenteditable='true']",
              );
              if (editable) return editable;
              nextTd = forward
                ? nextTd.nextElementSibling
                : nextTd.previousElementSibling;
            }
            return null;
          }
          // Helper: find first editable element in next row
          function findFirstEditableInNextRow(currentEl) {
            const tr = currentEl?.closest("tr");
            const nextTr = tr?.nextElementSibling;
            if (nextTr) {
              return nextTr.querySelector(
                "input:not([readonly]), textarea:not([readonly]), [contenteditable='true']",
              );
            }
            return null;
          }
          if (e.key === "Enter") {
            if (isLongTextField && e.shiftKey) {
              // Allow Shift+Enter to insert a newline without leaving the cell
              return;
            }
            e.preventDefault();
            commit(idx);
            // Auto-switch to next input in the cell
            if (inputRefs[idx + 1] && inputRefs[idx + 1].current) {
              inputRefs[idx + 1].current.focus();
              inputRefs[idx + 1].current.select?.();
              setFocusedIdx(idx + 1);
            } else {
              // Try to focus next editable element in the row
              const currentEl = inputRefs[idx].current;
              const nextEditable = findNextEditable(currentEl, true);
              if (nextEditable) {
                nextEditable.focus();
                nextEditable.select?.();
                setFocusedIdx(-1);
                return;
              }
              // If no more in row, focus first editable in next row
              const nextRowEditable = findFirstEditableInNextRow(currentEl);
              if (nextRowEditable) {
                nextRowEditable.focus();
                nextRowEditable.select?.();
                setFocusedIdx(-1);
              }
            }
          } else if (e.key === "Tab") {
            // Tab: move to next cell, Shift+Tab: previous cell
            e.preventDefault();
            const currentEl = inputRefs[idx].current;
            const targetEditable = findNextEditable(
              currentEl,
              !e.shiftKey ? true : false,
            );
            if (targetEditable) {
              targetEditable.focus();
              targetEditable.select?.();
              setFocusedIdx(-1);
            } else {
              // If no more cells, move to next row
              const nextRowEditable = findFirstEditableInNextRow(currentEl);
              if (nextRowEditable) {
                nextRowEditable.focus();
                nextRowEditable.select?.();
                setFocusedIdx(-1);
              }
            }
          } else if (e.key === "Escape") {
            e.preventDefault();
            setLocalValues(
              isArray
                ? displayValue.map((v) => String(v ?? ""))
                : [String(displayValue ?? "")],
            );
            setFocusedIdx(-1);
          }
        },
        className: `w-full border border-gray-200 rounded px-2 py-1 text-xs transition-all duration-150 outline-none focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white focus:shadow-[0_0_0_2px_#38bdf8] ${
          focusedIdx === idx
            ? "ring-2 ring-blue-400 bg-blue-50 shadow-[0_0_0_2px_#38bdf8]"
            : ""
        } ${readOnly ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""} ${
          isLongTextField ? "leading-snug" : ""
        }`,
        placeholder: col.label,
        readOnly: readOnly,
        tabIndex: readOnly ? -1 : 0,
        style: {
          color: "#000",
          whiteSpace: isLongTextField ? "pre-wrap" : undefined,
          resize: isLongTextField ? "vertical" : undefined,
          minHeight: isLongTextField ? 48 : undefined,
          maxHeight: isLongTextField ? 320 : undefined,
          lineHeight: isLongTextField ? 1.4 : undefined,
          overflowWrap: isLongTextField ? "anywhere" : undefined,
        },
        autoComplete: "off",
      };
    };

    // Render: always show the + button for editable cells
    if (!readOnly) {
      return (
        <div className="flex flex-col gap-1 w-full min-w-0">
          {localValues.map((val, idx) => (
            <div key={idx} className="flex items-start gap-1 w-full min-w-0">
              {(() => {
                const inputProps = getInputProps(idx);
                const { style: baseStyle, ...rest } = inputProps;
                const rowCount = isLongTextField
                  ? Math.min(12, Math.max(3, val.split(/\r?\n/).length))
                  : undefined;
                const InputComponent = isLongTextField ? "textarea" : "input";
                return (
                  <InputComponent
                    {...rest}
                    style={{
                      ...baseStyle,
                      width: "100%",
                      minWidth: 0,
                    }}
                    rows={isLongTextField ? rowCount : undefined}
                  />
                );
              })()}
              {localValues.length > 1 && (
                <button
                  type="button"
                  aria-label="Remove value"
                  onClick={() => handleRemoveValue(idx)}
                  className="text-red-500 hover:text-red-700 px-1 py-0.5 rounded focus:outline-none"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            aria-label="Add value"
            onClick={handleAddValue}
            className={`text-green-600 hover:text-green-800 px-1 py-0.5 rounded focus:outline-none flex items-center gap-1 mt-1 transition-all duration-150
              ${
                highlightAdd
                  ? "bg-yellow-100 border border-yellow-400 shadow-sm hover:bg-yellow-200"
                  : ""
              }
            `}
            title={
              highlightAdd
                ? "Add another value (multi-value supported)"
                : "Add value"
            }
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v8M8 12h8" />
            </svg>
            <span className="text-xs">Add</span>
          </button>
        </div>
      );
    }
    // Fallback: single input (readOnly or formula)
    // For formula columns, render all values (array or single)
    if (col.type === "formula" && Array.isArray(displayValue)) {
      return (
        <div className="flex flex-col gap-0.5">
          {displayValue.map((v, i) => (
            <span key={i}>{v}</span>
          ))}
        </div>
      );
    }
    const inputProps = getInputProps(0);
    const { style: baseStyle, ...rest } = inputProps;
    const InputComponent = isLongTextField ? "textarea" : "input";
    const rowCount = isLongTextField
      ? Math.min(
          12,
          Math.max(3, String(displayValue ?? "").split(/\r?\n/).length),
        )
      : undefined;
    return (
      <InputComponent
        {...rest}
        style={{
          ...baseStyle,
          width: "100%",
          minWidth: 0,
        }}
        rows={isLongTextField ? rowCount : undefined}
      />
    );
  }

  return (
    <div
      className={`${
        isFullscreen
          ? "fixed inset-0 z-50 bg-white p-6 overflow-auto animate-fade-in"
          : "p-6 max-w-full"
      } transition-all duration-300`}
    >
      {/* Print-safe table: never overflow horizontally in print */}
      <style jsx global>{`
        @media print {
          .print-safe-table,
          .print-safe-table * {
            font-size: 10px !important;
            table-layout: fixed !important;
            /* Use configurable print width (default 186mm) and center */
            --peipl-print-width: 170mm !important;
            max-width: var(--peipl-print-width) !important;
            width: 100% !important;
            margin-left: auto !important;
            margin-right: auto !important;
            word-break: break-word !important;
            white-space: pre-wrap !important;
            overflow: visible !important;
          }
          /* Print-only: hide everything except the print content area to avoid modal/container scaling */
          body * {
            visibility: hidden !important;
          }
          #print-content,
          #print-content * {
            visibility: visible !important;
          }
          #print-content {
            /* Use normal flow so browser respects @page margins; center via auto margins */
            position: static !important;
            width: var(--peipl-print-width) !important;
            margin: 15mm auto !important;
            box-sizing: border-box !important;
          }
          .print-safe-table th,
          .print-safe-table td {
            word-break: break-word !important;
            white-space: pre-wrap !important;
            overflow: visible !important;
            padding: 2px 3px !important;
            min-width: 0 !important;
          }
          .print-safe-table input,
          .print-safe-table textarea {
            font-size: 10px !important;
            width: 100% !important;
            min-width: 0 !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }
          .overflow-x-auto {
            overflow-x: visible !important;
          }
        }
      `}</style>
      {/* Particle background */}
      <style jsx>{`
        @keyframes floaty {
          0% {
            transform: translateY(0) translateX(0);
          }
          50% {
            transform: translateY(-8px) translateX(6px);
          }
          100% {
            transform: translateY(0) translateX(0);
          }
        }
        .particle {
          position: absolute;
          width: 8px;
          height: 8px;
          background: rgba(99, 102, 241, 0.12);
          border-radius: 50%;
          animation: floaty 6s ease-in-out infinite;
          pointer-events: none;
        }
        @media print {
          .particle {
            display: none !important;
          }
        }
        .drag-handle {
          cursor: grab;
          color: #6366f1;
          font-size: 16px;
          padding: 6px 8px;
          border-radius: 6px;
          transition: background 0.15s ease, transform 0.12s ease;
        }
        .drag-handle:hover {
          background: rgba(99, 102, 241, 0.06);
          transform: translateY(-1px);
        }
        .btn-modern {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 10px;
          border: none;
          font-weight: 600;
          box-shadow: 0 6px 18px rgba(15, 23, 42, 0.04);
          transition: transform 0.12s ease, box-shadow 0.12s ease,
            background 0.12s ease;
        }
        .btn-modern:active {
          transform: translateY(1px) scale(0.997);
        }
        .btn-add {
          background: linear-gradient(90deg, #10b981, #06b6d4);
          color: white;
        }
        .btn-col {
          background: rgba(99, 102, 241, 0.06);
          color: #4f46e5;
          border: 1px solid rgba(99, 102, 241, 0.12);
        }
        .btn-danger {
          background: linear-gradient(90deg, #fecaca, #f87171);
          color: #7f1d1d;
        }
        .row-hover:hover {
          background: rgba(99, 102, 241, 0.03);
        }
      `}</style>

      {/* Toolbar - animated buttons */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          {/* <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#019b98" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="icon-svg"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M7 7h10M7 12h7M7 17h5"/></svg> */}
          <h3 className="text-xl font-bold text-[#311703] tracking-wide m-0">
            Bill Items
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setPendingCol({ idx: columns.length, col: null });
              setNewColType("text");
              setNewColFormula("");
              setNewColLabel(`Column ${columns.length + 1}`);
              setNewColScope("current");
              setNewColSpecificPage(
                Math.min(Math.max(1, currentPage), totalPages),
              );
              setShowColTypeModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-[#019b98] bg-[#e6fcfa] text-[#019b98] font-semibold shadow-md hover:shadow-lg hover:bg-[#019b98] hover:text-white transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#019b98] focus:ring-offset-2"
            title="Add a new column to the table"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span>Add Column</span>
          </button>

          <div className="relative group">
            <button
              onClick={openAddRowFlow}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-[#10b981] bg-[#ecfdf5] text-[#10b981] font-semibold shadow-md hover:shadow-lg hover:bg-[#10b981] hover:text-white transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:ring-offset-2"
              title="Add a new row to the table"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
              <span>Add Row</span>
            </button>

            {/* Quick Add Row Options */}
            <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              <div className="p-2">
                <div className="text-xs font-semibold text-gray-600 mb-2">
                  Quick Add:
                </div>
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      const newItem = {
                        id: generateUniqueId(),
                        description: "",
                        sacHsn: "",
                        quantity: 1,
                        unit: "PCS",
                        rate: 0,
                        amount: 0,
                        cgstRate: 9,
                        cgstAmount: 0,
                        sgstRate: 9,
                        sgstAmount: 0,
                        totalWithGST: 0,
                        dates: [new Date().toISOString().split("T")[0]],
                      };
                      setBillData((prev) => ({
                        ...prev,
                        items: [...(prev.items || []), newItem],
                      }));
                      toast.success("New row added!", {
                        icon: "✅",
                        duration: 2000,
                      });
                    }}
                    className="w-full text-left px-3 py-2 text-sm font-semibold bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 text-green-700 rounded border border-green-200 transition-all duration-200 hover:shadow-md"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-lg">➕</span>
                      <span>Add New Row</span>
                    </span>
                  </button>
                  <button
                    onClick={() => setShowBulkAddModal(true)}
                    className="w-full text-left px-3 py-2 text-sm font-medium hover:bg-gray-100 rounded border-t border-gray-200 mt-2 pt-2 transition-all duration-150"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-base">🔢</span>
                      <span>Bulk Add Rows</span>
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowBillFormatPresets(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-[#f59e0b] bg-[#fef3c7] text-[#f59e0b] font-semibold shadow-md hover:shadow-lg hover:bg-[#f59e0b] hover:text-white transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#f59e0b] focus:ring-offset-2"
            title="Save and load bill format templates"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17,21 17,13 7,13 7,21" />
              <polyline points="7,3 7,8 15,8" />
            </svg>
            <span>Bill Formats</span>
          </button>

          <button
            onClick={() => setShowPrintPreview(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-[#6b7280] bg-[#f9fafb] text-[#6b7280] font-semibold shadow-md hover:shadow-lg hover:bg-[#6b7280] hover:text-white transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#6b7280] focus:ring-offset-2"
            title="Preview and print your bill"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6,9 6,2 18,2 18,9" />
              <path d="M6,18H4a2,2,0,0,1-2-2V11a2,2,0,0,1,2-2H20a2,2,0,0,1,2,2v5a2,2,0,0,1-2,2H18" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            <span>Print Preview</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-semibold shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              isFullscreen
                ? "border-red-500 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white focus:ring-red-500 animate-pulse-glow"
                : "border-[#8b5cf6] bg-[#f3f4f6] text-[#8b5cf6] hover:bg-[#8b5cf6] hover:text-white focus:ring-[#8b5cf6]"
            }`}
            title={isFullscreen ? "Exit Fullscreen (ESC)" : "Enter Fullscreen"}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {isFullscreen
                ? <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                : <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />}
            </svg>
            <span>{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</span>
          </button>

          <div className="relative group">
            <button
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-[#6366f1] bg-[#eef2ff] text-[#6366f1] font-semibold shadow-md hover:shadow-lg hover:bg-[#6366f1] hover:text-white transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#6366f1] focus:ring-offset-2"
              title="View keyboard shortcuts and tips"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
              <span>Help</span>
            </button>

            {/* Keyboard Shortcuts Tooltip */}
            <div className="absolute bottom-full right-0 mb-2 w-80 bg-white border border-gray-300 rounded-lg shadow-2xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none group-hover:pointer-events-auto">
              <div className="p-4 bg-gradient-to-r from-[#6366f1] to-[#4f46e5] text-white rounded-t-lg">
                <h4 className="font-bold text-sm m-0 flex items-center gap-2">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                    <polyline points="13 2 13 9 20 9" />
                  </svg>
                  Keyboard Shortcuts
                </h4>
              </div>
              <div className="p-4 space-y-3 text-sm">
                <div>
                  <div className="font-semibold text-gray-700 mb-2">
                    Editing:
                  </div>
                  <div className="space-y-1 text-gray-600">
                    <div className="flex justify-between items-start">
                      <span>Double-click cell</span>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                        Edit
                      </span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span>Tab</span>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                        Next cell
                      </span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span>Shift+Tab</span>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                        Prev cell
                      </span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span>Enter</span>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                        Confirm edit
                      </span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span>Esc</span>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                        Cancel edit
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-3">
                  <div className="font-semibold text-gray-700 mb-2">
                    Features:
                  </div>
                  <div className="space-y-1 text-gray-600">
                    <div className="flex justify-between items-start">
                      <span>Drag rows</span>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                        Reorder
                      </span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span>Click formula cell</span>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                        Math expressions
                      </span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span>Esc (Fullscreen)</span>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                        Exit fullscreen
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-3">
                  <div className="font-semibold text-gray-700 mb-2">Tips:</div>
                  <ul className="text-gray-600 space-y-1 list-disc list-inside">
                    <li>
                      Use formulas like{" "}
                      <span className="font-mono bg-gray-100 px-1">
                        quantity*rate
                      </span>
                    </li>
                    <li>Columns auto-calculate based on formulas</li>
                    <li>Save formats as presets for reuse</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-xl border border-[#019b98]/30 rounded-xl overflow-hidden mt-4">
        <div className="overflow-x-auto max-w-full">
          <div className="bg-gradient-to-r from-[#019b98]/10 to-[#0a7a78]/10 border-b border-[#019b98]/20 px-6 py-4">
            <h3 className="text-lg font-bold mb-0 flex items-center gap-2">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[#019b98]"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14,2 14,8 20,8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10,9 9,9 8,9" />
              </svg>
              <input
                type="text"
                value={tableTitle}
                onChange={(e) =>
                  setBillData((prev) => ({
                    ...prev,
                    tableTitle: e.target.value,
                  }))
                }
                className="font-bold text-lg border-none bg-transparent w-full rounded px-2 py-1 focus:ring-2 focus:ring-blue-200 focus:bg-white transition-all"
                placeholder="Table Title"
              />
            </h3>
          </div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={columns.map((col) => `col-${col.key}`)}
              strategy={horizontalListSortingStrategy}
            >
              <SortableContext
                items={items.map((row, idx) => `row-${row.id || idx}`)}
                strategy={verticalListSortingStrategy}
              >
                <table
                  className="w-full text-xs print-safe-table border-separate border-spacing-0 min-w-max rounded-lg overflow-hidden"
                  style={{
                    color: "#000",
                    tableLayout: "fixed",
                    width: "100%",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
                  }}
                >
                  <colgroup>
                    {[
                      <col key="drag-col" style={{ width: "40px" }} />,
                      ...columns.map((col) => (
                        <col
                          key={col.key}
                          style={{ width: isLongTextColumn(col) ? "14%" : "auto" }}
                        />
                      )),
                      <col key="action-col" style={{ width: "80px" }} />,
                    ]}
                  </colgroup>

                  <thead className="bg-gradient-to-r from-[#019b98] to-[#0a7a78]">
                    <tr>
                      <th
                        className="px-4 py-4 text-left font-bold border-b-2 border-white/20 text-white"
                        style={{
                          color: "#fff",
                          width: 40,
                          textTransform: "uppercase",
                          fontSize: "12px",
                          letterSpacing: "0.5px",
                        }}
                      ></th>
                      {columns.map((col, idx) => (
                        <SortableColumn key={col.key} col={col} idx={idx}>
                          <input
                            type="text"
                            value={col.label}
                            onChange={(e) => {
                              const newCols = [...columns];
                              newCols[idx] = { ...col, label: e.target.value };
                              setBillData((prev) => ({
                                ...prev,
                                columns: newCols,
                              }));
                            }}
                            className="font-bold text-xs border-none bg-transparent flex-1 min-w-[80px] px-1 py-0.5 rounded focus:ring-2 focus:ring-blue-200 focus:bg-white transition-all"
                            placeholder="Column Title"
                            style={{ color: "#000" }}
                          />
                          {columns.length > 1 && (
                            <button
                              onClick={() => {
                                const colKey = col.key;
                                setBillData((prev) => ({
                                  ...prev,
                                  columns: columns.filter(
                                    (_, cidx) => cidx !== idx,
                                  ),
                                  items: items.map((row) => {
                                    const newRow = { ...row };
                                    delete newRow[colKey];
                                    return newRow;
                                  }),
                                }));
                              }}
                              className="px-1 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-500 cursor-pointer text-sm ml-2"
                              title="Remove column"
                              style={{
                                background: "#f1f5f9",
                                border: "1px solid black",
                                padding: "0px 5px",
                                color: "#000",
                                boxShadow: "none",
                                lineHeight: "20px",
                              }}
                            >
                              ×
                            </button>
                          )}
                        </SortableColumn>
                      ))}
                      <th
                        className="px-4 py-4 text-center font-bold border-b-2 border-white/20 text-white"
                        style={{
                          color: "#fff",
                          textTransform: "uppercase",
                          fontSize: "12px",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {items.length === 0
                      ? <tr>
                          <td
                            colSpan={columns.length + 2}
                            className="text-center py-4 text-[#019b98]/60"
                          >
                            <svg
                              width="32"
                              height="32"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="#019b98"
                              strokeWidth="2.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="inline-block mr-2 icon-svg"
                            >
                              <rect x="3" y="3" width="18" height="18" rx="4" />
                              <path d="M7 7h10M7 12h7M7 17h5" />
                            </svg>
                            No items
                          </td>
                        </tr>
                      : <>
                          {currentPage > 1 && (
                            <tr>
                              <td
                                colSpan={columns.length + 2}
                                className="px-3 py-2 bg-slate-50 font-semibold text-sm"
                              >
                                <div className="print-page-label">
                                  {tableTitle} — Page {currentPage} of{" "}
                                  {totalPages}
                                </div>
                                {tableTitle}
                              </td>
                            </tr>
                          )}
                          {(() => {
                            const start = (currentPage - 1) * rowsPerPage;
                            const pageRows = items.slice(
                              start,
                              start + rowsPerPage,
                            );
                            return pageRows.map((row, relIdx) => {
                              const rowIdx = start + relIdx;
                              return (
                                <SortableRow
                                  key={row.id || rowIdx}
                                  row={row}
                                  rowIdx={rowIdx}
                                >
                                  <td
                                    className="px-4 py-3 text-center border-r border-gray-200 transition-colors"
                                    style={{
                                      cursor: "grab",
                                      color: "#019b98",
                                      width: 40,
                                    }}
                                    title="Drag to reorder rows"
                                  >
                                    <svg
                                      width="16"
                                      height="16"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2.2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      className="icon-svg"
                                    >
                                      <path d="M3 7h18v2H3V7zm0 4h18v2H3v-2zm0 4h18v2H3v-2z" />
                                    </svg>
                                  </td>
                                  {columns.map((col) => {
                                    const inputType = col.type || "text";
                                    let readOnly = false;
                                    let displayValue = row[col.key];
                                    // For formula columns, calculateRowFormulas may have stored array results
                                    if (col.type === "formula" && col.formula) {
                                      readOnly = true;
                                    }
                                    const isLongText = isLongTextColumn(col);
                                    return (
                                      <td
                                        key={col.key}
                                        className="px-4 py-3 align-top border-r border-gray-200 last:border-r-0 transition-colors"
                                        style={{
                                          color: "#1f2937",
                                          whiteSpace: "pre-wrap",
                                          wordBreak: "break-word",
                                          overflowWrap: "anywhere",
                                          minWidth: isLongText ? 200 : 120,
                                          width: isLongText
                                            ? "auto"
                                            : undefined,
                                          fontSize: "13px",
                                        }}
                                      >
                                        <EditableCell
                                          row={row}
                                          rowIdx={rowIdx}
                                          col={col}
                                          inputType={inputType}
                                          readOnly={readOnly}
                                          displayValue={displayValue}
                                        />
                                      </td>
                                    );
                                  })}
                                  <td
                                    className="px-3 py-2 text-center"
                                    style={{ color: "#000" }}
                                  >
                                    <button
                                      onClick={() =>
                                        setBillData((prev) => ({
                                          ...prev,
                                          items: items.filter(
                                            (_, idx) => idx !== rowIdx,
                                          ),
                                        }))
                                      }
                                      className="inline-flex items-center justify-center gap-1 px-2 py-1 rounded-md border-2 border-red-500 bg-red-50 text-red-500 font-semibold shadow-sm hover:bg-red-500 hover:text-white transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 text-sm"
                                      title="Remove item"
                                      aria-label="Remove item"
                                    >
                                      <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="icon-svg"
                                      >
                                        <polyline points="3,6 5,6 21,6" />
                                        <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6" />
                                        <line x1="10" y1="11" x2="10" y2="17" />
                                        <line x1="14" y1="11" x2="14" y2="17" />
                                      </svg>
                                      <span className="sr-only">Remove</span>
                                    </button>
                                  </td>
                                </SortableRow>
                              );
                            });
                          })()}

                          {/* Totals Row */}
                          {items.length > 0 && (
                            <tr className="bg-gray-50 border-t-2 border-gray-300">
                              <td
                                className="px-3 py-2 font-bold text-gray-700"
                                colSpan="2"
                              >
                                <div className="flex items-center gap-2">
                                  <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M9 11H5a2 2 0 0 0-2 2v3c0 1.1.9 2 2 2h4m0-7v7m0-7h10a2 2 0 0 1 2 2v3c0 1.1-.9 2-2 2H9m0-7V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                                  </svg>
                                  <span>TOTALS</span>
                                </div>
                              </td>
                              {columns.map((col) => {
                                const total = columnTotals[col.key];
                                const isNumericColumn =
                                  col.type === "number" ||
                                  col.type === "formula";

                                // Debug logging for each column (disabled)

                                return (
                                  <td
                                    key={col.key}
                                    className={`px-3 py-2 font-bold text-right ${
                                      isNumericColumn
                                        ? "text-green-700 bg-green-50"
                                        : "text-gray-500"
                                    }`}
                                  >
                                    {isNumericColumn && total
                                      ? col.key === "quantity"
                                        ? <span className="flex items-center justify-end">
                                            <span>{total}</span>
                                          </span>
                                        : <span className="flex items-center justify-end gap-1">
                                            <span>₹</span>
                                            <span>{total}</span>
                                          </span>
                                      : <span className="text-gray-400">
                                          -
                                        </span>}
                                  </td>
                                );
                              })}
                              <td className="px-3 py-2"></td>
                            </tr>
                          )}

                          <tr>
                            <td
                              colSpan={columns.length + 2}
                              className="text-center py-2"
                            >
                              <div className="flex flex-col lg:flex-row items-center justify-between gap-4 p-2">
                                {/* Rows per page selector */}
                                <div className="flex items-center gap-2 order-1 lg:order-1">
                                  <label className="text-sm text-gray-600 font-medium whitespace-nowrap">
                                    Rows per page:
                                  </label>
                                  <select
                                    value={rowsPerPage}
                                    onChange={(e) => {
                                      const newRowsPerPage = Number(
                                        e.target.value,
                                      );
                                      setBillData((prev) => ({
                                        ...prev,
                                        rowsPerPage: newRowsPerPage,
                                      }));
                                      setCurrentPage(1); // Reset to first page
                                    }}
                                    className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#019b98] focus:border-transparent min-w-0"
                                  >
                                    <option value={1}>1</option>
                                    <option value={5}>5</option>
                                    <option value={8}>8</option>
                                    <option value={10}>10</option>
                                  </select>
                                </div>

                                {/* Pagination controls */}
                                <div className="flex items-center gap-2 order-2 lg:order-2">
                                  <button
                                    onClick={() =>
                                      setCurrentPage((p) => Math.max(1, p - 1))
                                    }
                                    disabled={currentPage <= 1}
                                    className={`inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-md border-2 border-[#019b98] bg-[#e6fcfa] text-[#019b98] font-semibold shadow-sm hover:bg-[#019b98] hover:text-white transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#019b98] focus:ring-offset-2 text-sm ${
                                      currentPage <= 1
                                        ? "opacity-60 cursor-not-allowed"
                                        : ""
                                    }`}
                                    aria-label="Previous page"
                                  >
                                    <svg
                                      width="14"
                                      height="14"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2.2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      className="icon-svg"
                                    >
                                      <polyline points="15,18 9,12 15,6" />
                                    </svg>
                                    <span className="hidden sm:inline">
                                      Prev
                                    </span>
                                  </button>
                                  <div className="text-sm text-gray-600 px-1 sm:px-2 whitespace-nowrap">
                                    Page {currentPage} / {totalPages}
                                  </div>
                                  <button
                                    onClick={() =>
                                      setCurrentPage((p) =>
                                        Math.min(totalPages, p + 1),
                                      )
                                    }
                                    disabled={currentPage >= totalPages}
                                    className={`inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-md border-2 border-[#019b98] bg-[#e6fcfa] text-[#019b98] font-semibold shadow-sm hover:bg-[#019b98] hover:text-white transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#019b98] focus:ring-offset-2 text-sm ${
                                      currentPage >= totalPages
                                        ? "opacity-60 cursor-not-allowed"
                                        : ""
                                    }`}
                                    aria-label="Next page"
                                  >
                                    <span className="hidden sm:inline">
                                      Next
                                    </span>
                                    <svg
                                      width="14"
                                      height="14"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2.2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      className="icon-svg"
                                    >
                                      <polyline points="9,18 15,12 9,6" />
                                    </svg>
                                  </button>
                                </div>

                                {/* Page management buttons */}
                                <div className="flex items-center gap-1 sm:gap-2 order-3 lg:order-3">
                                  <button
                                    onClick={() => changeManualExtraPages(1)}
                                    className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-md border-2 border-[#ffd700] bg-[#fffbe6] text-[#bfa100] font-semibold shadow-sm hover:bg-[#ffd700] hover:text-[#311703] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#ffd700] focus:ring-offset-2 text-sm"
                                    aria-label="Add page"
                                    title="Add empty page"
                                  >
                                    <svg
                                      width="14"
                                      height="14"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2.2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      className="icon-svg"
                                    >
                                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                      <polyline points="14,2 14,8 20,8" />
                                      <line x1="16" y1="13" x2="8" y2="13" />
                                      <line x1="16" y1="17" x2="8" y2="17" />
                                      <polyline points="10,9 9,9 8,9" />
                                    </svg>
                                    <span className="hidden md:inline">
                                      Add Page
                                    </span>
                                  </button>
                                  <button
                                    onClick={() => changeManualExtraPages(-1)}
                                    disabled={manualExtraPages <= 0}
                                    className={`inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-md border-2 border-[#ff7f50] bg-[#fff0ea] text-[#ff7f50] font-semibold shadow-sm hover:bg-[#ff7f50] hover:text-white transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#ff7f50] focus:ring-offset-2 text-sm ${
                                      manualExtraPages <= 0
                                        ? "opacity-60 cursor-not-allowed"
                                        : ""
                                    }`}
                                    aria-label="Remove page"
                                    title="Remove last empty page"
                                  >
                                    <svg
                                      width="14"
                                      height="14"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2.2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      className="icon-svg"
                                    >
                                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                      <polyline points="14,2 14,8 20,8" />
                                      <line x1="16" y1="13" x2="8" y2="13" />
                                      <line x1="16" y1="17" x2="8" y2="17" />
                                      <polyline points="10,9 9,9 8,9" />
                                      <line x1="8" y1="11" x2="16" y2="11" />
                                    </svg>
                                    <span className="hidden md:inline">
                                      Remove Page
                                    </span>
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        </>}
                  </tbody>
                </table>
              </SortableContext>
            </SortableContext>
          </DndContext>
        </div>
      </div>

      {/* ✅ Move fade-in style OUTSIDE of tbody/tr */}
      <style jsx>{`
        @keyframes fadein {
          from {
            opacity: 0;
            transform: translateY(16px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }
        .animate-fadein {
          animation: fadein 0.48s cubic-bezier(0.4, 0, 0.2, 1) both;
        }
      `}</style>

      {/* Date Modal */}
      {showDateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 max-w-sm w-full mx-4 border border-gray-300">
            <h3 className="text-sm font-bold mb-4">Add Date to Item</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Select Date
                </label>
                <input
                  type="date"
                  value={billData.date}
                  onChange={(e) =>
                    setBillData((prev) => ({ ...prev, date: e.target.value }))
                  }
                  className="w-full border-2 border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => addDateToItem(showDateModal)}
                  className="flex-1 inline-flex items-center justify-center gap-1 bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 transition-colors duration-300 text-sm"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  Add Date
                </button>
                <button
                  onClick={() => setShowDateModal(null)}
                  className="flex-1 inline-flex items-center justify-center gap-1 bg-gray-300 text-gray-700 px-4 py-2 hover:bg-gray-400 transition-colors duration-300 text-sm"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Presets Modal */}
      {showPresets && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 max-w-md w-full mx-4 border border-gray-300 rounded-xl shadow-xl">
            <h3 className="text-base font-bold mb-3">Presets</h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="Preset name"
                  className="flex-1 border border-gray-200 rounded px-2 py-1 text-sm"
                />
                <button
                  onClick={() => savePreset(presetName)}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <polyline points="17,21 17,13 7,13 7,21" />
                    <polyline points="7,3 7,8 15,8" />
                  </svg>
                  Save
                </button>
              </div>
              <div className="max-h-56 overflow-auto border-t border-gray-100 pt-2">
                {(presets || []).length === 0
                  ? <div className="text-sm text-gray-500">
                      No presets saved
                    </div>
                  : (presets || []).map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between py-2 border-b border-gray-50"
                      >
                        <div>
                          <div className="font-medium text-sm">{p.name}</div>
                          <div className="text-xs text-gray-500">
                            {(p.columns || []).map((c) => c.label).join(", ")}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => loadPreset(p)}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-700 text-sm rounded hover:bg-slate-200 transition-colors"
                          >
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="7,10 12,15 17,10" />
                              <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            Load
                          </button>
                          <button
                            onClick={() => deletePreset(p.id)}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 text-sm rounded hover:bg-red-100 transition-colors"
                          >
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="3,6 5,6 21,6" />
                              <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
              </div>
              <div className="flex justify-end mt-3">
                <button
                  onClick={() => setShowPresets(false)}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Add-Where Modal */}
      {showAddWhereModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96 border border-gray-200 shadow-xl">
            <h3 className="text-base font-bold mb-3">
              Where to add the new row?
            </h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="addwhere"
                  checked={addWhereOption === "current"}
                  onChange={() => setAddWhereOption("current")}
                />
                <span className="text-sm">
                  Current page (Page {currentPage})
                </span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="addwhere"
                  checked={addWhereOption === "specific"}
                  onChange={() => setAddWhereOption("specific")}
                />
                <span className="text-sm">Specific page</span>
              </label>
              {addWhereOption === "specific" && (
                <div className="pl-6">
                  <input
                    type="number"
                    min={1}
                    max={Math.max(1, totalPages)}
                    value={addSpecificPage}
                    onChange={(e) => setAddSpecificPage(Number(e.target.value))}
                    className="w-24 border border-gray-200 rounded px-2 py-1 text-sm"
                  />
                </div>
              )}
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="addwhere"
                  checked={addWhereOption === "last"}
                  onChange={() => setAddWhereOption("last")}
                />
                <span className="text-sm">Last page</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="addwhere"
                  checked={addWhereOption === "new"}
                  onChange={() => setAddWhereOption("new")}
                />
                <span className="text-sm">Create a new page and add</span>
              </label>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  setShowAddWhereModal(false);
                }}
                className="inline-flex items-center gap-1 px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 transition-colors"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                Cancel
              </button>
              <button
                onClick={() => performAddRow(addWhereOption, addSpecificPage)}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20,6 9,17 4,12" />
                </svg>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Column Type Modal */}
      {showColTypeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 max-w-md w-full mx-4 border border-gray-300 rounded-xl shadow-xl">
            <h3 className="text-base font-bold mb-3">Column</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Label
                </label>
                <input
                  value={newColLabel}
                  onChange={(e) => setNewColLabel(e.target.value)}
                  placeholder="Column label"
                  className="w-full border border-gray-200 rounded px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Column Type
                </label>
                <select
                  value={newColType}
                  onChange={(e) => {
                    setNewColType(e.target.value);
                    // Clear formula when changing type
                    if (e.target.value !== "formula") {
                      setNewColFormula("");
                      setFormulaError(null);
                      setIsFormulaValid(true);
                    }
                  }}
                  className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {columnTypes.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}{" "}
                      {t.value === "formula"
                        ? "(Calculated)"
                        : t.value === "number"
                          ? "(Numeric)"
                          : t.value === "date"
                            ? "(Date Picker)"
                            : "(Text Input)"}
                    </option>
                  ))}
                </select>
                <div className="text-xs text-gray-500 mt-1">
                  {newColType === "text" && "Free text input"}
                  {newColType === "number" &&
                    "Numeric input with decimal support"}
                  {newColType === "date" && "Date picker input"}
                  {newColType === "formula" &&
                    "Calculated field based on other columns"}
                </div>
              </div>
              {newColType === "formula" && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Formula Expression
                  </label>
                  <input
                    value={newColFormula}
                    onChange={(e) => setNewColFormula(e.target.value)}
                    placeholder="e.g. quantity*rate, amount*0.09, (qty*rate)+tax"
                    className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Use column names as variables. Examples: quantity*rate,
                    amount*0.09, (qty*rate)+tax
                  </div>
                  {formulaError && (
                    <div className="text-red-500 text-xs mt-1 font-medium">
                      ❌ {formulaError}
                    </div>
                  )}
                  {!formulaError && newColFormula && (
                    <div className="text-green-600 text-xs mt-1 font-medium">
                      ✅ Formula is valid
                    </div>
                  )}
                </div>
              )}
              <div className="pt-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Apply column to
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="colscope"
                      checked={newColScope === "current"}
                      onChange={() => setNewColScope("current")}
                    />{" "}
                    <span className="text-sm">
                      Current page (Page {currentPage})
                    </span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="colscope"
                      checked={newColScope === "specific"}
                      onChange={() => setNewColScope("specific")}
                    />{" "}
                    <span className="text-sm">Specific page</span>
                  </label>
                  {newColScope === "specific" && (
                    <div className="pl-6">
                      <input
                        type="number"
                        min={1}
                        max={Math.max(1, totalPages)}
                        value={newColSpecificPage}
                        onChange={(e) =>
                          setNewColSpecificPage(Number(e.target.value))
                        }
                        className="w-24 border border-gray-200 rounded px-2 py-1 text-sm"
                      />
                    </div>
                  )}
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="colscope"
                      checked={newColScope === "all"}
                      onChange={() => setNewColScope("all")}
                    />{" "}
                    <span className="text-sm">All pages</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => {
                    setShowColTypeModal(false);
                    setPendingCol(null);
                    setNewColScope("current");
                    setNewColSpecificPage(1);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                  Cancel
                </button>
                <button
                  onClick={() => {
                    savePendingColumn();
                    setNewColScope("current");
                    setNewColSpecificPage(1);
                  }}
                  disabled={newColType === "formula" && !isFormulaValid}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20,6 9,17 4,12" />
                  </svg>
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bill Format Presets Modal */}
      {showBillFormatPresets && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 max-w-2xl w-full mx-4 border border-gray-300 rounded-xl shadow-xl">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[#f59e0b]"
              >
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17,21 17,13 7,13 7,21" />
                <polyline points="7,3 7,8 15,8" />
              </svg>
              Bill Format Presets
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Save and load complete bill formats including table structure,
              column types, and settings.
            </p>

            <div className="space-y-4">
              {/* Save new preset */}
              <div className="flex gap-2 p-4 bg-gray-50 rounded-lg">
                <input
                  type="text"
                  value={billFormatPresetName}
                  onChange={(e) => setBillFormatPresetName(e.target.value)}
                  placeholder="Enter preset name (e.g., 'Standard Invoice', 'Service Bill')"
                  className="flex-1 border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f59e0b] focus:border-transparent"
                />
                <button
                  onClick={() => saveBillFormatPreset(billFormatPresetName)}
                  className="inline-flex items-center gap-1 px-4 py-2 bg-[#f59e0b] text-white rounded text-sm hover:bg-[#d97706] transition-colors"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <polyline points="17,21 17,13 7,13 7,21" />
                    <polyline points="7,3 7,8 15,8" />
                  </svg>
                  Save Format
                </button>
              </div>

              {/* List existing presets */}
              <div className="max-h-80 overflow-auto border border-gray-200 rounded-lg">
                {(billFormatPresets || []).length === 0
                  ? <div className="p-8 text-center text-gray-500">
                      <svg
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mx-auto mb-3 text-gray-400"
                      >
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                        <polyline points="17,21 17,13 7,13 7,21" />
                        <polyline points="7,3 7,8 15,8" />
                      </svg>
                      <p className="text-sm">
                        No bill format presets saved yet
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Create your first preset above
                      </p>
                    </div>
                  : (billFormatPresets || []).map((preset) => (
                      <div
                        key={preset.id}
                        className="flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-sm text-gray-900">
                            {preset.name}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {preset.description}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            Saved:{" "}
                            {new Date(preset.savedAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => loadBillFormatPreset(preset)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-600 text-sm rounded hover:bg-blue-100 transition-colors"
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="7,10 12,15 17,10" />
                              <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            Load
                          </button>
                          <button
                            onClick={() => deleteBillFormatPreset(preset.id)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-red-50 text-red-600 text-sm rounded hover:bg-red-100 transition-colors"
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="3,6 5,6 21,6" />
                              <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setShowBillFormatPresets(false)}
                  className="inline-flex items-center gap-1 px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Preview Modal */}
      {showPrintPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 max-w-6xl w-full mx-4 border border-gray-300 rounded-xl shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-gray-600"
                >
                  <polyline points="6,9 6,2 18,2 18,9" />
                  <path d="M6,18H4a2,2,0,0,1-2-2V11a2,2,0,0,1,2-2H20a2,2,0,0,1,2,2v5a2,2,0,0,1-2,2H18" />
                  <rect x="6" y="14" width="12" height="8" />
                </svg>
                Print Preview
              </h3>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 mr-4">
                  <div className="text-xs text-gray-600 mr-2">Width:</div>
                  <div className="inline-flex rounded-md bg-gray-50 p-1">
                    <button
                      type="button"
                      onClick={() => setPrintWidthPreset("narrow")}
                      className={`px-2 py-1 text-xs rounded ${
                        printWidthPreset === "narrow"
                          ? "bg-white shadow-sm font-semibold"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      Narrow
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrintWidthPreset("default")}
                      className={`px-2 py-1 text-xs rounded ${
                        printWidthPreset === "default"
                          ? "bg-white shadow-sm font-semibold"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      Default
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrintWidthPreset("wide")}
                      className={`px-2 py-1 text-xs rounded ${
                        printWidthPreset === "wide"
                          ? "bg-white shadow-sm font-semibold"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      Wide
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6,9 6,2 18,2 18,9" />
                    <path d="M6,18H4a2,2,0,0,1-2-2V11a2,2,0,0,1,2-2H20a2,2,0,0,1,2,2v5a2,2,0,0,1-2,2H18" />
                    <rect x="6" y="14" width="12" height="8" />
                  </svg>
                  Print
                </button>
                <button
                  onClick={() => setShowPrintPreview(false)}
                  className="inline-flex items-center gap-1 px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 transition-colors"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                  Close
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto border border-gray-200 rounded-lg bg-white">
              <div
                className="p-6 print:p-4"
                id="print-content"
                style={{ "--peipl-print-width": computedPrintWidth }}
              >
                {/* Print Header */}
                <div className="text-center mb-6 print:mb-4">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2 print:text-xl">
                    {tableTitle}
                  </h1>
                  <p className="text-sm text-gray-600 print:text-xs">
                    Generated on {new Date().toLocaleDateString()} at{" "}
                    {new Date().toLocaleTimeString()}
                  </p>
                </div>

                {/* Print Table */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-400 text-sm print:text-xs">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-400 px-3 py-2 text-left font-semibold">
                          #
                        </th>
                        {columns
                          .sort((a, b) => {
                            // Ensure proper column order: Sr. No. & Date, Ref No., Description, SAC/HSN, Qty, Rate, Amount, CGST, SGST, Total
                            const order = [
                              "srNoDate",
                              "refNo",
                              "description",
                              "sacHsn",
                              "quantity",
                              "rate",
                              "amount",
                              "cgstAmount",
                              "sgstAmount",
                              "totalWithGST",
                            ];
                            const aIndex = order.indexOf(a.key);
                            const bIndex = order.indexOf(b.key);
                            if (aIndex === -1 && bIndex === -1) return 0;
                            if (aIndex === -1) return 1;
                            if (bIndex === -1) return -1;
                            return aIndex - bIndex;
                          })
                          .map((col) => (
                            <th
                              key={col.key}
                              className="border border-gray-400 px-3 py-2 text-left font-semibold"
                            >
                              {col.label}
                            </th>
                          ))}
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((row, rowIdx) => (
                        <tr key={row.id || rowIdx} className="hover:bg-gray-50">
                          <td className="border border-gray-400 px-3 py-2">
                            {rowIdx + 1}
                          </td>
                          {columns
                            .sort((a, b) => {
                              // Ensure proper column order: Sr. No. & Date, Ref No., Description, SAC/HSN, Qty, Rate, Amount, CGST, SGST, Total
                              const order = [
                                "srNoDate",
                                "refNo",
                                "description",
                                "sacHsn",
                                "quantity",
                                "rate",
                                "amount",
                                "cgstAmount",
                                "sgstAmount",
                                "totalWithGST",
                              ];
                              const aIndex = order.indexOf(a.key);
                              const bIndex = order.indexOf(b.key);
                              if (aIndex === -1 && bIndex === -1) return 0;
                              if (aIndex === -1) return 1;
                              if (bIndex === -1) return -1;
                              return aIndex - bIndex;
                            })
                            .map((col) => {
                              let displayValue = row[col.key] ?? "";
                              if (col.type === "formula" && col.formula) {
                                try {
                                  const scope = {};
                                  columns.forEach((c) => {
                                    const v = row[c.key];
                                    if (v === "" || v == null) scope[c.key] = 0;
                                    else if (Array.isArray(v)) scope[c.key] = 0;
                                    else {
                                      const n = Number(v);
                                      scope[c.key] = isNaN(n) ? 0 : n;
                                    }
                                  });
                                  const compiled = math.compile(col.formula);
                                  const val = compiled.evaluate(scope);
                                  displayValue =
                                    typeof val === "number"
                                      ? val.toFixed(2)
                                      : String(val);
                                } catch (err) {
                                  displayValue = "Err";
                                }
                              }
                              return (
                                <td
                                  key={col.key}
                                  className="border border-gray-400 px-3 py-2"
                                >
                                  {displayValue}
                                </td>
                              );
                            })}
                        </tr>
                      ))}

                      {/* Print Totals Row */}
                      {items.length > 0 && (
                        <tr className="bg-gray-100 font-bold">
                          <td
                            className="border border-gray-400 px-3 py-2"
                            colSpan="2"
                          >
                            TOTALS
                          </td>
                          {columns
                            .sort((a, b) => {
                              // Ensure proper column order: Sr. No. & Date, Ref No., Description, SAC/HSN, Qty, Rate, Amount, CGST, SGST, Total
                              const order = [
                                "srNoDate",
                                "refNo",
                                "description",
                                "sacHsn",
                                "quantity",
                                "rate",
                                "amount",
                                "cgstAmount",
                                "sgstAmount",
                                "totalWithGST",
                              ];
                              const aIndex = order.indexOf(a.key);
                              const bIndex = order.indexOf(b.key);
                              if (aIndex === -1 && bIndex === -1) return 0;
                              if (aIndex === -1) return 1;
                              if (bIndex === -1) return -1;
                              return aIndex - bIndex;
                            })
                            .map((col) => {
                              const total = columnTotals[col.key];
                              const isNumericColumn =
                                col.type === "number" || col.type === "formula";

                              // Special handling for specific columns
                              let displayValue = "-";
                              if (isNumericColumn && total) {
                                if (col.key === "quantity") {
                                  displayValue = total; // Quantity should not have ₹ symbol
                                } else {
                                  displayValue = `₹${total}`; // All other numeric columns get ₹ symbol
                                }
                              }

                              return (
                                <td
                                  key={col.key}
                                  className="border border-gray-400 px-3 py-2 text-right"
                                >
                                  {displayValue}
                                </td>
                              );
                            })}
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Print Footer */}
                <div className="mt-6 pt-4 border-t border-gray-300 print:mt-4 print:pt-2">
                  <div className="text-xs text-gray-500 text-center">
                    <p>This document was generated by PEIPL Bill Maker</p>
                    <p>Page 1 of 1 • {new Date().toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Add Rows Modal */}
      {showBulkAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 max-w-md w-full mx-4 border border-gray-300 rounded-xl shadow-xl">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-green-600"
              >
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
              Bulk Add Rows
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Add multiple rows at once to your table.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of rows to add
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={bulkAddCount}
                  onChange={(e) =>
                    setBulkAddCount(
                      Math.max(1, Math.min(50, parseInt(e.target.value) || 1)),
                    )
                  }
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <div className="text-xs text-gray-500 mt-1">
                  You can add between 1 and 50 rows at once
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowBulkAddModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const newItems = [];
                    for (let i = 0; i < bulkAddCount; i++) {
                      newItems.push({
                        id: generateUniqueId(),
                        description: "",
                        sacHsn: "",
                        quantity: 1,
                        unit: "PCS",
                        rate: 0,
                        amount: 0,
                        cgstRate: 9,
                        cgstAmount: 0,
                        sgstRate: 9,
                        sgstAmount: 0,
                        totalWithGST: 0,
                        dates: [new Date().toISOString().split("T")[0]],
                      });
                    }
                    setBillData((prev) => ({
                      ...prev,
                      items: [...(prev.items || []), ...newItems],
                    }));
                    toast.success(`${bulkAddCount} rows added successfully!`);
                    setShowBulkAddModal(false);
                    setBulkAddCount(1);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                >
                  Add {bulkAddCount} Row{bulkAddCount > 1 ? "s" : ""}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
