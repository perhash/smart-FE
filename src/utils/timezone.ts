/**
 * Timezone utility for PKT (Pakistan Time, UTC+5)
 * Helper functions for working with dates in PKT timezone on the frontend
 */

// PKT is UTC+5
const PKT_OFFSET_HOURS = 5;

/**
 * Get today's date string in PKT format (YYYY-MM-DD)
 * @returns {string} Today's date in PKT as YYYY-MM-DD string
 */
export function getTodayPktDate(): string {
  const now = new Date();
  
  // Add PKT offset to current UTC time to get PKT time
  const pktNow = new Date(now.getTime() + (PKT_OFFSET_HOURS * 60 * 60 * 1000));
  
  // Extract date components in UTC (which now represents PKT time)
  const year = pktNow.getUTCFullYear();
  const month = String(pktNow.getUTCMonth() + 1).padStart(2, '0');
  const day = String(pktNow.getUTCDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Convert a UTC date to PKT date string (YYYY-MM-DD)
 * @param {Date} date - Date object
 * @returns {string} Date string in YYYY-MM-DD format (as it would appear in PKT)
 */
export function formatPktDate(date: Date): string {
  const pktDate = new Date(date.getTime() + (PKT_OFFSET_HOURS * 60 * 60 * 1000));
  const year = pktDate.getUTCFullYear();
  const month = String(pktDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(pktDate.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

