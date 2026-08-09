import { format as formatDateFns, isValid, parse } from "date-fns";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import { parseISO } from "date-fns/parseISO";

export type CustomDate = Date;

/**
 * Formats a date using date-fns.
 * @param value Date, string, or Date-like input
 * @param format Format string (default: dd-MM-yyyy)
 */
export function formatDate(
  value: Date | string | undefined,
  format = "yyyy-MM-dd HH:mm:ss"
): string {
  if (!value) return "";

  const dateObj = typeof value === "string" ? parseISO(value) : value;
  if (!isValid(dateObj)) return "";
  return formatDateFns(dateObj, format);
}

/**
 * Returns a human-readable relative date (e.g. "3 hours ago")
 */
export function formatRelativeDate(value: Date | string): string {
  const dateObj = typeof value === "string" ? parseISO(value) : value;
  if (!isValid(dateObj)) return "";
  return formatDistanceToNow(dateObj, { addSuffix: true });
}
