import { Event, EventFormData } from '../types/Event';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { generateDemoEvents } from './dataGenerator';

const API_DELAY = 100;

// Helper functions to work with dates
const formatDateKey = (date: Date): string => {
  return dayjs(date).format('YYYY-MM-DD');
};

const getStartOfDay = (timestamp: number): string => {
  return dayjs(timestamp).startOf('day').format('YYYY-MM-DD');
};

// Simulate a database with localStorage
const STORAGE_KEY = 'calendarEvents';

export const getStoredEvents = (): Record<string, Event[]> => {
  const storedEvents = localStorage.getItem(STORAGE_KEY);
  if (storedEvents) {
    return JSON.parse(storedEvents);
  }

  // If no events exist, initialize with demo data
  const demoData = generateDemoEvents();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(demoData));
  return demoData;
};

export const storeEvents = (events: Record<string, Event[]>) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
};

// Add artificial delay to simulate network request
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Generate a timestamp for created/updated fields
const getTimestamp = (): string => new Date().toISOString();

/**
 * Fetch events within a specific date range
 * @param startDate - The start date of the range
 * @param endDate - The end date of the range
 * @returns An array of events within the range
 */
export const fetchEventsByDateRange = async (startDate: Date, endDate: Date): Promise<Event[]> => {
  await delay(API_DELAY); // Simulate API call delay

  const startDateStr = formatDateKey(startDate);
  const endDateStr = formatDateKey(endDate);

  const allEvents = getStoredEvents();
  const events: Event[] = [];

  // Collect all events in the date range
  Object.keys(allEvents).forEach(dateKey => {
    // If the date key is within our range
    if (dateKey >= startDateStr && dateKey <= endDateStr) {
      events.push(...allEvents[dateKey]);
      return;
    }

    // For each event on this day, check if it overlaps with our range
    allEvents[dateKey].forEach(event => {
      const eventStartDate = getStartOfDay(event.startTimestamp);
      const eventEndDate = getStartOfDay(event.endTimestamp);

      // Event starts before range but ends within/after range
      if (eventStartDate < startDateStr && eventEndDate >= startDateStr) {
        events.push(event);
      }
      // Event starts within range but ends after range
      else if (eventStartDate <= endDateStr && eventEndDate > endDateStr) {
        events.push(event);
      }
      // Event spans across the entire range
      else if (eventStartDate < startDateStr && eventEndDate > endDateStr) {
        events.push(event);
      }
    });
  });

  return events;
};

/**
 * Backward compatibility - Fetch events for a specific month
 */
export const fetchMonthEvents = async (date: Date): Promise<Event[]> => {
  const monthStart = dayjs(date).startOf('month').toDate();
  const monthEnd = dayjs(date).endOf('month').toDate();
  return fetchEventsByDateRange(monthStart, monthEnd);
};

/**
 * Create a new event
 */
export const createEvent = async (eventData: EventFormData): Promise<Event> => {
  await delay(API_DELAY); // Simulate API call delay

  if (!eventData.startTimestamp || !eventData.endTimestamp) {
    throw new Error('Event start and end timestamps are required');
  }

  const events = getStoredEvents();

  // Convert form data to event
  const newEvent: Event = {
    id: uuidv4(),
    name: eventData.name,
    startTimestamp: eventData.startTimestamp,
    endTimestamp: eventData.endTimestamp,
    isMultiDay: !!eventData.isMultiDay,
    createdAt: getTimestamp(),
    updatedAt: getTimestamp(),
    type: eventData.type || 'personal',
  };

  // Store the event based on its start date
  const dateKey = getStartOfDay(newEvent.startTimestamp);
  if (!events[dateKey]) {
    events[dateKey] = [];
  }
  events[dateKey].push(newEvent);

  storeEvents(events);
  return newEvent;
};

/**
 * Update an existing event
 */
export const updateEvent = async (eventData: EventFormData): Promise<Event> => {
  await delay(API_DELAY); // Simulate API call delay

  if (!eventData.id || !eventData.startTimestamp || !eventData.endTimestamp) {
    throw new Error('Event ID, start and end timestamps are required for updates');
  }

  const events = getStoredEvents();
  let updatedEvent: Event | null = null;
  let originalDateKey: string | null = null;

  // Find the original event date first
  Object.keys(events).forEach(dateKey => {
    const eventIndex = events[dateKey].findIndex(e => e.id === eventData.id);
    if (eventIndex >= 0) {
      originalDateKey = dateKey;
    }
  });

  if (!originalDateKey) {
    throw new Error(`Event with id ${eventData.id} not found`);
  }

  // Convert form data to event
  const eventToUpdate: Event = {
    id: eventData.id,
    name: eventData.name,
    startTimestamp: eventData.startTimestamp,
    endTimestamp: eventData.endTimestamp,
    isMultiDay: !!eventData.isMultiDay,
    createdAt: '', // Will be preserved from the original
    updatedAt: getTimestamp(),
    type: eventData.type || 'personal',
  };

  // Find and update the event
  const originalEvents = events[originalDateKey];
  const eventIndex = originalEvents.findIndex(e => e.id === eventToUpdate.id);

  if (eventIndex >= 0) {
    // Preserve created date
    eventToUpdate.createdAt = originalEvents[eventIndex].createdAt;

    // Calculate the new date key based on the start timestamp
    const newDateKey = getStartOfDay(eventToUpdate.startTimestamp);

    // If the date has changed, move to new date
    if (originalDateKey !== newDateKey) {
      // Remove from old date
      events[originalDateKey] = originalEvents.filter(e => e.id !== eventToUpdate.id);

      // Add to new date
      if (!events[newDateKey]) {
        events[newDateKey] = [];
      }
      events[newDateKey].push(eventToUpdate);
    } else {
      // Update in place
      originalEvents[eventIndex] = eventToUpdate;
    }

    updatedEvent = eventToUpdate;
  }

  if (!updatedEvent) {
    throw new Error(`Event with id ${eventData.id} not found`);
  }

  storeEvents(events);
  return updatedEvent;
};

/**
 * Delete an event
 */
export const deleteEvent = async (id: string): Promise<void> => {
  await delay(API_DELAY); // Simulate API call delay

  const events = getStoredEvents();

  // Remove event from all dates
  Object.keys(events).forEach(dateKey => {
    events[dateKey] = events[dateKey].filter(event => event.id !== id);
  });

  storeEvents(events);
};
