/**
 * Type for event colors in the UI
 */
export interface EventTypeColors {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
}

/**
 * Color definitions for different event types
 */
export const EVENT_TYPE_COLORS: Record<string, EventTypeColors> = {
  work: {
    backgroundColor: 'bg-blue-100',
    borderColor: 'border-blue-500',
    textColor: 'text-blue-800',
  },
  personal: {
    backgroundColor: 'bg-pink-100',
    borderColor: 'border-pink-500',
    textColor: 'text-pink-800',
  },
  meeting: {
    backgroundColor: 'bg-orange-100',
    borderColor: 'border-orange-500',
    textColor: 'text-orange-800',
  },
  social: {
    backgroundColor: 'bg-purple-100',
    borderColor: 'border-purple-500',
    textColor: 'text-purple-800',
  },
  health: {
    backgroundColor: 'bg-green-100',
    borderColor: 'border-green-500',
    textColor: 'text-green-800',
  },
  travel: {
    backgroundColor: 'bg-indigo-100',
    borderColor: 'border-indigo-500',
    textColor: 'text-indigo-800',
  },
  education: {
    backgroundColor: 'bg-yellow-100',
    borderColor: 'border-yellow-500',
    textColor: 'text-yellow-800',
  },
};

/**
 * Default colors to use when an event type doesn't have a defined color
 */
const DEFAULT_COLORS: EventTypeColors = {
  backgroundColor: 'bg-gray-100',
  borderColor: 'border-gray-500',
  textColor: 'text-gray-800',
};

/**
 * Get colors for a specific event type with fallback to defaults
 * @param type The event type
 * @returns The colors for the event type
 */
export const getEventTypeColors = (type: string): EventTypeColors => {
  return EVENT_TYPE_COLORS[type] || DEFAULT_COLORS;
};
