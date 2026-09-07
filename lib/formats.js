/**
 * Formatting utility functions for file sizes, dates, etc.
 */

/**
 * Converts a raw byte count into a human-readable string with units (B, KB, MB, GB, TB).
 * @param {number|string} bytes - File size in bytes
 * @returns {string} Formatted size string (e.g. "12.4 MB") or empty string if 0/null
 */
export function formatFileSize(bytes) {
  const numBytes = Number(bytes);
  if (!numBytes || numBytes <= 0 || isNaN(numBytes)) return "";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(numBytes) / Math.log(k));
  const clampedIndex = Math.min(i, sizes.length - 1);
  const formatted = parseFloat((numBytes / Math.pow(k, clampedIndex)).toFixed(1));

  return `${formatted} ${sizes[clampedIndex]}`;
}

/**
 * Formats an ISO or timestamp date string into a localized readable date.
 * @param {string|number|Date} dateVal - Input date value
 * @returns {string} Formatted date string (e.g. "06 Sep 2026, 14:30")
 */
export function formatDate(dateVal) {
  if (!dateVal) return "";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(dateVal);
  }
}
