import { useState, useMemo, useCallback, useRef, useLayoutEffect, useEffect } from 'react';
import { InventoryItem, Category, ActivityEntry } from '../../../shared/types';
import { ModalCloseReason } from '../../../shared/lib/hooks/useModalNavigation';
interface UseAddItemFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory: string;
  initialValues?: Partial<Omit<InventoryItem, 'id' | 'createdAt'>> | null;
  editItem?: InventoryItem | null;
  isDuplicate?: boolean;
  items: InventoryItem[];
  activities: ActivityEntry[];
  onAdd: (item: Omit<InventoryItem, 'id' | 'createdAt'>) => void;
  onEdit?: (id: string, updates: Partial<InventoryItem>) => void;
}

export function useAddItemForm({
  isOpen,
  onClose,
  initialCategory,
  initialValues,
  editItem,
  isDuplicate,
  items,
  activities,
  onAdd,
  onEdit,
}: UseAddItemFormProps) {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState(initialCategory);
  const [stock, setStock] = useState('0');
  const [unit, setUnit] = useState('個');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [contentAmount, setContentAmount] = useState('');
  const [contentUnit, setContentUnit] = useState('個');
  const [alertThreshold, setAlertThreshold] = useState('1');
  const [alertThresholdPercent, setAlertThresholdPercent] = useState('20');
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isUnitPickerOpen, setIsUnitPickerOpen] = useState(false);

  const contentAmountRepeatRef = useRef<number | null>(null);
  const contentAmountLongPressRef = useRef<number | null>(null);
  const stockRepeatRef = useRef<number | null>(null);
  const stockLongPressRef = useRef<number | null>(null);
  const alertRepeatRef = useRef<number | null>(null);
  const alertLongPressRef = useRef<number | null>(null);

  const initialFormState = useMemo(() => {
    if (editItem) {
      return {
        name: editItem.name,
        categoryId: editItem.categoryId,
        stock: editItem.stock.toString(),
        unit: '個',
        purchasePrice: editItem.purchasePrice?.toString() || '',
        contentAmount: editItem.contentAmount?.toString() || '',
        contentUnit: editItem.contentUnit || editItem.unit,
        alertThreshold: editItem.alertThreshold.toString(),
        alertThresholdPercent: (editItem.alertThresholdPercent ?? 20).toString(),
        expiryDate: editItem.expiryDate || '',
        notes: editItem.notes || '',
      };
    }

    return {
      name: initialValues?.name || '',
      categoryId: initialValues?.categoryId || initialCategory,
      stock: initialValues?.stock?.toString() || '0',
      unit: '個',
      purchasePrice: initialValues?.purchasePrice?.toString() || '',
      contentAmount: initialValues?.contentAmount?.toString() || '',
      contentUnit: initialValues?.contentUnit || '個',
      alertThreshold: initialValues?.alertThreshold?.toString() || '1',
      alertThresholdPercent: (initialValues?.alertThresholdPercent ?? 20).toString(),
      expiryDate: initialValues?.expiryDate || '',
      notes: initialValues?.notes || '',
    };
  }, [editItem, initialCategory, initialValues]);

  const hasUnsavedChanges =
    name !== initialFormState.name ||
    categoryId !== initialFormState.categoryId ||
    stock !== initialFormState.stock ||
    unit !== initialFormState.unit ||
    purchasePrice !== initialFormState.purchasePrice ||
    contentAmount !== initialFormState.contentAmount ||
    contentUnit !== initialFormState.contentUnit ||
    alertThreshold !== initialFormState.alertThreshold ||
    alertThresholdPercent !== initialFormState.alertThresholdPercent ||
    expiryDate !== initialFormState.expiryDate ||
    notes !== initialFormState.notes;

  const handleRequestClose = useCallback((reason?: ModalCloseReason) => {
    if (!hasUnsavedChanges) {
      onClose();
      return;
    }

    if (reason === 'popstate') {
      window.history.pushState({ modalOpen: true }, '');
    }

    setShowUnsavedConfirm(true);
  }, [hasUnsavedChanges, onClose]);

  const handleConfirmDiscard = () => {
    setShowUnsavedConfirm(false);
    onClose();
  };

  const handleCancelDiscard = () => {
    setShowUnsavedConfirm(false);
  };

  const suggestions = useMemo(() => {
    if (!name.trim() || name.length < 1) return [];
    
    // 1. Calculate frequency and recency from activities
    const stats = new Map<string, { count: number; lastUsed: number }>();
    const now = Date.now();

    // Activities provide usage history
    activities.forEach(activity => {
      const lowerName = activity.itemName.toLowerCase();
      const timeWeight = Math.max(0, 1 - (now - new Date(activity.timestamp).getTime()) / (30 * 24 * 60 * 60 * 1000)); // Decay over 30 days
      const current = stats.get(lowerName) || { count: 0, lastUsed: 0 };
      stats.set(lowerName, {
        count: current.count + (1 + timeWeight), // More weight to frequent and recent items
        lastUsed: Math.max(current.lastUsed, new Date(activity.timestamp).getTime())
      });
    });

    // Items list provides unique templates
    const uniqueItemsMap = new Map<string, InventoryItem>();
    items.forEach(item => {
      const lowerName = item.name.toLowerCase();
      if (!uniqueItemsMap.has(lowerName) || (!uniqueItemsMap.get(lowerName)?.isArchived && item.isArchived)) {
         // Prefer active items as templates, but keep archived ones if they are unique
         uniqueItemsMap.set(lowerName, item);
      }
    });

    return Array.from(uniqueItemsMap.values())
      .filter(item => 
        item.name.toLowerCase().includes(name.toLowerCase()) && 
        item.name.toLowerCase() !== name.toLowerCase()
      )
      .sort((a, b) => {
        const statsA = stats.get(a.name.toLowerCase()) || { count: 0, lastUsed: 0 };
        const statsB = stats.get(b.name.toLowerCase()) || { count: 0, lastUsed: 0 };
        
        // Primary sort by frequency (weighted), secondary by name
        if (statsB.count !== statsA.count) return statsB.count - statsA.count;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 8); // Increased to 8 for better reach
  }, [items, activities, name]);

  const handleSelectSuggestion = (suggestion: InventoryItem) => {
    setName(suggestion.name);
    setCategoryId(suggestion.categoryId);
    setUnit('個');
    setContentUnit(suggestion.contentUnit || suggestion.unit);
    setShowSuggestions(false);
  };

  const getUnitPrice = useCallback(() => {
    const price = parseFloat(purchasePrice);
    const amount = parseFloat(contentAmount);

    if (!Number.isFinite(price) || price <= 0) return null;
    if (!Number.isFinite(amount) || amount <= 0) return price;
    return Math.round((price / amount) * 100) / 100;
  }, [purchasePrice, contentAmount]);

  const changeStockBy = (delta: number) => {
    setStock(current => {
      const nextValue = Math.max(0, (parseInt(current) || 0) + delta);
      return nextValue.toString();
    });
  };

  const changeAlertThresholdBy = (delta: number) => {
    setAlertThreshold(current => {
      const nextValue = Math.max(0, (parseInt(current) || 0) + delta);
      return nextValue.toString();
    });
  };

  const changeContentAmountBy = (delta: number) => {
    setContentAmount(current => {
      const currentValue = parseFloat(current) || 0;
      const nextValue = Math.max(0, Math.round((currentValue + delta) * 100) / 100);
      return Number.isInteger(nextValue) ? String(nextValue) : nextValue.toString();
    });
  };

  const clearContentAmountTimers = () => {
    if (contentAmountLongPressRef.current !== null) {
      window.clearTimeout(contentAmountLongPressRef.current);
      contentAmountLongPressRef.current = null;
    }
    if (contentAmountRepeatRef.current !== null) {
      window.clearInterval(contentAmountRepeatRef.current);
      contentAmountRepeatRef.current = null;
    }
  };

  const clearStockTimers = () => {
    if (stockLongPressRef.current !== null) {
      window.clearTimeout(stockLongPressRef.current);
      stockLongPressRef.current = null;
    }
    if (stockRepeatRef.current !== null) {
      window.clearInterval(stockRepeatRef.current);
      stockRepeatRef.current = null;
    }
  };

  const clearAlertTimers = () => {
    if (alertLongPressRef.current !== null) {
      window.clearTimeout(alertLongPressRef.current);
      alertLongPressRef.current = null;
    }
    if (alertRepeatRef.current !== null) {
      window.clearInterval(alertRepeatRef.current);
      alertRepeatRef.current = null;
    }
  };

  const startContentAmountAdjust = (delta: number) => {
    clearContentAmountTimers();
    changeContentAmountBy(delta);
    contentAmountLongPressRef.current = window.setTimeout(() => {
      contentAmountRepeatRef.current = window.setInterval(() => {
        changeContentAmountBy(delta);
      }, 120);
    }, 320);
  };

  const stopContentAmountAdjust = () => clearContentAmountTimers();

  const startStockAdjust = (delta: number) => {
    if (delta < 0 && (parseInt(stock) || 0) <= 0) return;
    clearStockTimers();
    changeStockBy(delta);
    stockLongPressRef.current = window.setTimeout(() => {
      stockRepeatRef.current = window.setInterval(() => {
        changeStockBy(delta);
      }, 120);
    }, 320);
  };

  const stopStockAdjust = () => clearStockTimers();

  const startAlertAdjust = (delta: number) => {
    if (delta < 0 && (parseInt(alertThreshold) || 0) <= 0) return;
    clearAlertTimers();
    changeAlertThresholdBy(delta);
    alertLongPressRef.current = window.setTimeout(() => {
      alertRepeatRef.current = window.setInterval(() => {
        changeAlertThresholdBy(delta);
      }, 120);
    }, 320);
  };

  const stopAlertAdjust = () => clearAlertTimers();

  const handleSelectContentUnit = (selectedUnit: string) => {
    setContentUnit(selectedUnit);
    setIsUnitPickerOpen(false);
  };

  useLayoutEffect(() => {
    if (isOpen) {
      if (editItem) {
        setName(editItem.name);
        setCategoryId(editItem.categoryId);
        setStock(editItem.stock.toString());
        setUnit('個');
        setPurchasePrice(editItem.purchasePrice?.toString() || '');
        setContentAmount(editItem.contentAmount?.toString() || '');
        setContentUnit(editItem.contentUnit || editItem.unit);
        setAlertThreshold(editItem.alertThreshold.toString());
        setAlertThresholdPercent((editItem.alertThresholdPercent ?? 20).toString());
        setExpiryDate(editItem.expiryDate || '');
        setNotes(editItem.notes || '');
        setShowUnsavedConfirm(false);
      } else {
        setName(initialValues?.name || '');
        setCategoryId(initialValues?.categoryId || initialCategory);
        setStock(initialValues?.stock?.toString() || '0');
        setUnit('個');
        setPurchasePrice(initialValues?.purchasePrice?.toString() || '');
        setContentAmount(initialValues?.contentAmount?.toString() || '');
        setContentUnit(initialValues?.contentUnit || '個');
        setAlertThreshold(initialValues?.alertThreshold?.toString() || '1');
        setAlertThresholdPercent((initialValues?.alertThresholdPercent ?? 20).toString());
        setExpiryDate(initialValues?.expiryDate || '');
        setNotes(initialValues?.notes || '');
        setIsUnitPickerOpen(false);
        setShowUnsavedConfirm(false);
      }
    }
  }, [isOpen, initialCategory, editItem, initialValues]);

  useEffect(() => {
    return () => {
      clearContentAmountTimers();
      clearStockTimers();
      clearAlertTimers();
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const unitPrice = getUnitPrice();
    const data = {
      name: name.trim(),
      categoryId,
      stock: parseInt(stock) || 0,
      unit: '個',
      purchasePrice: purchasePrice.trim() ? Math.max(0, parseFloat(purchasePrice) || 0) : undefined,
      contentAmount: contentAmount.trim() ? Math.max(0, parseFloat(contentAmount) || 0) : undefined,
      contentUnit: contentAmount.trim() ? (contentUnit.trim() || '個') : undefined,
      pricePerUnit: unitPrice ?? undefined,
      lowestPricePerUnit: unitPrice ?? undefined,
      priceHistory: purchasePrice.trim()
        ? [{
            timestamp: new Date().toISOString(),
            purchasePrice: Math.max(0, parseFloat(purchasePrice) || 0),
            contentAmount: contentAmount.trim() ? Math.max(0, parseFloat(contentAmount) || 0) : undefined,
            contentUnit: contentAmount.trim() ? (contentUnit.trim() || '個') : undefined,
            pricePerUnit: unitPrice ?? 0,
            notes: notes.trim() || undefined,
          }]
        : [],
      alertThreshold: parseInt(alertThreshold) || 0,
      alertThresholdPercent: parseInt(alertThresholdPercent) || 20,
      expiryDate: expiryDate || undefined,
      notes: notes.trim() || undefined,
    };

    if (editItem && onEdit && !isDuplicate) {
      onEdit(editItem.id, data);
    } else {
      onAdd({
        ...data,
        isOpened: false,
        originalItemId: undefined,
        remainingAmount: undefined,
        remainingPercent: undefined,
      });
    }
    
    onClose();
  };

  return {
    state: {
      name,
      categoryId,
      stock,
      unit,
      purchasePrice,
      contentAmount,
      contentUnit,
      alertThreshold,
      alertThresholdPercent,
      expiryDate,
      notes,
      showUnsavedConfirm,
      showSuggestions,
      isUnitPickerOpen,
      suggestions,
      hasUnsavedChanges,
    },
    actions: {
      setName,
      setCategoryId,
      setStock,
      setPurchasePrice,
      setContentAmount,
      setAlertThreshold,
      setAlertThresholdPercent,
      setExpiryDate,
      setNotes,
      setShowSuggestions,
      setIsUnitPickerOpen,
      handleRequestClose,
      handleConfirmDiscard,
      handleCancelDiscard,
      handleSelectSuggestion,
      handleSelectContentUnit,
      startContentAmountAdjust,
      stopContentAmountAdjust,
      startStockAdjust,
      stopStockAdjust,
      startAlertAdjust,
      stopAlertAdjust,
      handleSubmit,
      getUnitPrice,
    }
  };
}
