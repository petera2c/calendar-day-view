// Initialize storage with demo data by importing getStoredEvents
import { getStoredEvents } from './eventService';
getStoredEvents();

// Export everything from the API modules
export { EVENT_TYPES_DATA } from './eventTypes';
export { fetchMonthEvents, createEvent, updateEvent, deleteEvent } from './eventService';
