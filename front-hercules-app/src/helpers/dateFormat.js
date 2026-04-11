export const DATE_FORMAT_HINT = 'MM-DD-AAAA';

function isValidDate(date) {
  return date instanceof Date && !Number.isNaN(date.getTime());
}

function formatFromDate(date) {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const yyyy = String(date.getFullYear());
  return `${mm}-${dd}-${yyyy}`;
}

export function formatDateMMDDYYYY(value) {
  if (value === null || value === undefined) return '';

  if (value instanceof Date) {
    return isValidDate(value) ? formatFromDate(value) : '';
  }

  const raw = String(value).trim();
  if (!raw) return '';

  const mdyMatch = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:\b.*)?$/);
  if (mdyMatch) {
    const mm = mdyMatch[1].padStart(2, '0');
    const dd = mdyMatch[2].padStart(2, '0');
    const yyyy = mdyMatch[3];
    return `${mm}-${dd}-${yyyy}`;
  }

  const ymdMatch = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s].*)?$/);
  if (ymdMatch) {
    const yyyy = ymdMatch[1];
    const mm = ymdMatch[2].padStart(2, '0');
    const dd = ymdMatch[3].padStart(2, '0');
    return `${mm}-${dd}-${yyyy}`;
  }

  const parsed = new Date(raw);
  if (isValidDate(parsed)) {
    return formatFromDate(parsed);
  }

  return raw;
}
