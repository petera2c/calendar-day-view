/**
 * Represents a calendar event
 */
export interface Event {
  id: string;
  name: string;
  startTimestamp: number; // Unix timestamp in milliseconds
  endTimestamp: number; // Unix timestamp in milliseconds
  isMultiDay?: boolean;
  createdAt: string;
  updatedAt: string;
  type: EventType; // Event type (work, personal, meeting, etc.)
}

/**
 * Form data for creating or editing events
 */
export interface EventFormData {
  id?: string;
  name: string;
  startTimestamp?: number;
  endTimestamp?: number;
  isMultiDay?: boolean;
  type?: EventType; // Event type
}

/**
 * Event type constants
 */
export type EventType =
  | 'work'
  | 'personal'
  | 'meeting'
  | 'social'
  | 'health'
  | 'travel'
  | 'education';
