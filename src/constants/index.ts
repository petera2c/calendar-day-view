// Time constants
export const HOUR_HEIGHT_REM = 4;
export const HOURS_IN_DAY = 24;
export const DAYS_IN_WEEK = 7;

// Format constants
export const DATE_FORMAT = 'YYYY-MM-DD';
export const MONTH_YEAR_FORMAT = 'MMMM YYYY';
export const DATE_DISPLAY_FORMAT = 'dddd, MMMM D';
export const HOUR_DISPLAY_FORMAT = 'h A'; // 1 PM

// Calendar layout
export const MINI_CALENDAR_WIDTH = 280;

// CSS class names
export const CSS_CLASSES = {
  TODAY: 'bg-blue-50',
  SELECTED_DAY: 'bg-blue-100',
  HOVER_DAY: 'hover:bg-gray-50',
};

// Event creation defaults
export const DEFAULT_EVENT_DURATION = 1; // 1 hour

// Export event type colors from the new utility file
export { EVENT_TYPE_COLORS as EVENT_TYPES_COLORS } from '../utils/eventColors';
