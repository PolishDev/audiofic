/**
 * Date and timezone utilities for Brasília (America/Sao_Paulo / UTC-3).
 */

/**
 * Returns the date formatted as YYYY-MM-DD in America/Sao_Paulo timezone.
 */
export function getBrasiliaDateString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * Calculates the exact next midnight (00:00:00 BRT) in UTC.
 * Note: Since Brasília (America/Sao_Paulo) does not observe daylight savings time,
 * midnight BRT (00:00:00 UTC-3) corresponds to 03:00:00 UTC of the next day.
 */
export function getNextBrasiliaMidnight(date: Date = new Date()): Date {
  const dateStr = getBrasiliaDateString(date);
  const [year, month, day] = dateStr.split('-').map(Number);
  // Next calendar day in Brasília starts at 03:00:00.000 UTC
  return new Date(Date.UTC(year, month - 1, day + 1, 3, 0, 0, 0));
}
