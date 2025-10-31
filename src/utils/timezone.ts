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
 * @param {Date|string} date - Date object or ISO string
 * @returns {string} Date string in YYYY-MM-DD format (as it would appear in PKT)
 */
export function formatPktDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const pktDate = new Date(dateObj.getTime() + (PKT_OFFSET_HOURS * 60 * 60 * 1000));
  const year = pktDate.getUTCFullYear();
  const month = String(pktDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(pktDate.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format time in 12-hour format with AM/PM in PKT
 * @param {Date|string} date - Date object or ISO string
 * @returns {string} Time in 12-hour format (e.g., "02:30 PM")
 */
export function formatPktTime12Hour(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const pktDate = new Date(dateObj.getTime() + (PKT_OFFSET_HOURS * 60 * 60 * 1000));
  
  let hours = pktDate.getUTCHours();
  const minutes = pktDate.getUTCMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  
  const minutesStr = String(minutes).padStart(2, '0');
  return `${hours}:${minutesStr} ${ampm}`;
}

/**
 * Format date and time in PKT with 12-hour time format
 * @param {Date|string} date - Date object or ISO string
 * @returns {string} Date and time string (e.g., "Oct 31, 2024 02:30 PM")
 */
export function formatPktDateTime12Hour(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const pktDate = new Date(dateObj.getTime() + (PKT_OFFSET_HOURS * 60 * 60 * 1000));
  
  const year = pktDate.getUTCFullYear();
  const month = pktDate.getUTCMonth();
  const day = pktDate.getUTCDate();
  
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthName = monthNames[month];
  
  let hours = pktDate.getUTCHours();
  const minutes = pktDate.getUTCMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  hours = hours % 12;
  hours = hours ? hours : 12;
  
  const minutesStr = String(minutes).padStart(2, '0');
  
  return `${monthName} ${day}, ${year} ${hours}:${minutesStr} ${ampm}`;
}

/**
 * Format relative time (e.g., "2 mins ago", "1 hour ago") in PKT
 * @param {Date|string} date - Date object or ISO string (UTC)
 * @returns {string} Relative time string
 */
export function formatPktRelativeTime(date: Date | string): string {
  // Parse the date - if it's a string, it should be UTC ISO format
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Get current time in UTC
  const now = new Date();
  
  // Calculate difference in milliseconds (both are UTC, so difference is correct)
  const diffMs = now.getTime() - dateObj.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'min' : 'mins'} ago`;
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  
  // For older dates, show the actual date and time in PKT
  return formatPktDateTime12Hour(date);
}

