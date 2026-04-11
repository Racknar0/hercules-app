import { useMemo, useState } from 'react';

const normalizeSortableValue = (value) => {
  if (value == null) {
    return '';
  }

  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    return value.trim().toLowerCase();
  }

  return String(value).trim().toLowerCase();
};

const compareValues = (leftValue, rightValue) => {
  const normalizedLeft = normalizeSortableValue(leftValue);
  const normalizedRight = normalizeSortableValue(rightValue);

  if (typeof normalizedLeft === 'number' && typeof normalizedRight === 'number') {
    return normalizedLeft - normalizedRight;
  }

  return String(normalizedLeft).localeCompare(String(normalizedRight), 'es', {
    numeric: true,
    sensitivity: 'base',
  });
};

const useSortableData = (
  items,
  {
    initialKey = null,
    initialDirection = 'asc',
    getValue,
  } = {}
) => {
  const [sortConfig, setSortConfig] = useState(
    initialKey
      ? { key: initialKey, direction: initialDirection }
      : { key: null, direction: 'asc' }
  );

  const sortedItems = useMemo(() => {
    const safeItems = Array.isArray(items) ? [...items] : [];

    if (!sortConfig.key || typeof getValue !== 'function') {
      return safeItems;
    }

    safeItems.sort((leftItem, rightItem) => {
      const result = compareValues(
        getValue(leftItem, sortConfig.key),
        getValue(rightItem, sortConfig.key)
      );

      return sortConfig.direction === 'asc' ? result : -result;
    });

    return safeItems;
  }, [getValue, items, sortConfig]);

  const requestSort = (key) => {
    setSortConfig((currentConfig) => {
      if (currentConfig.key === key) {
        return {
          key,
          direction: currentConfig.direction === 'asc' ? 'desc' : 'asc',
        };
      }

      return { key, direction: 'asc' };
    });
  };

  const getSortDirection = (key) =>
    sortConfig.key === key ? sortConfig.direction : null;

  return {
    sortedItems,
    sortConfig,
    requestSort,
    getSortDirection,
  };
};

export default useSortableData;