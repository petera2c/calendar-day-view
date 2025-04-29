import dayjs from 'dayjs';
import { Event, EventFormData } from '../types/event';
import { DATE_FORMAT, DEFAULT_EVENT_DURATION } from '../constants';

/**
 * Get the hour from a timestamp (0-23)
 */
export const getHourFromTimestamp = (timestamp: number): number => {
  return dayjs(timestamp).hour() + dayjs(timestamp).minute() / 60;
};

/**
 * Calculate the top position of an event based on its start timestamp
 */
export const getEventTopPosition = (startTimestamp: number, hourHeightRem: number): string => {
  const hour = getHourFromTimestamp(startTimestamp);
  return `${hour * hourHeightRem}rem`;
};

/**
 * Calculate the height of an event based on its duration
 */
export const getEventHeight = (
  startTimestamp: number,
  endTimestamp: number,
  hourHeightRem: number
): string => {
  const startHour = getHourFromTimestamp(startTimestamp);
  const endHour = getHourFromTimestamp(endTimestamp);
  const duration = endHour - startHour;
  return `${duration * hourHeightRem}rem`;
};

/**
 * Interface for processed event with positioning information
 */
export interface PositionedEvent extends Event {
  top: string;
  height: string;
  width: string;
  left: string;
  zIndex: number;
}

/**
 * Calculate overlapping event groups and assign positions
 * This implements a similar algorithm to Google Calendar for event display
 */
export const calculateEventPositions = (
  events: Event[],
  hourHeightRem: number = 4
): PositionedEvent[] => {
  if (!events.length) return [];

  // Sort events by start time
  const sortedEvents = [...events].sort((a, b) => {
    // Primary sort by start time
    if (a.startTimestamp !== b.startTimestamp) return a.startTimestamp - b.startTimestamp;
    // Secondary sort by end time (longer events first)
    return b.endTimestamp - a.endTimestamp;
  });

  // Identify collision groups (events that overlap in time)
  const collisionGroups: Event[][] = [];

  sortedEvents.forEach(event => {
    // Check if this event collides with any existing group
    let foundGroup = false;

    for (const group of collisionGroups) {
      // Check if event overlaps with any event in this group
      const eventOverlapsWithGroup = group.some(groupEvent => {
        return (
          event.startTimestamp < groupEvent.endTimestamp &&
          event.endTimestamp > groupEvent.startTimestamp
        );
      });

      if (eventOverlapsWithGroup) {
        group.push(event);
        foundGroup = true;
        break;
      }
    }

    // If no collision found, create a new group
    if (!foundGroup) {
      collisionGroups.push([event]);
    }
  });

  // Process each collision group to calculate positions
  const positionedEvents: PositionedEvent[] = [];

  collisionGroups.forEach(group => {
    if (group.length === 1) {
      // Single event in group (no collisions)
      const event = group[0];
      positionedEvents.push({
        ...event,
        top: getEventTopPosition(event.startTimestamp, hourHeightRem),
        height: getEventHeight(event.startTimestamp, event.endTimestamp, hourHeightRem),
        width: '95%', // Leave small gap
        left: '0%',
        zIndex: 1,
      });
    } else {
      // Multiple events in group (need to handle overlaps)
      // Sort by start time then by duration (longest first)
      const sortedGroup = [...group].sort((a, b) => {
        if (a.startTimestamp !== b.startTimestamp) return a.startTimestamp - b.startTimestamp;
        return b.endTimestamp - b.startTimestamp - (a.endTimestamp - a.startTimestamp);
      });

      // Track columns for this group
      const columns: Event[][] = [];

      // Assign each event to a column
      sortedGroup.forEach(event => {
        // Find the first column where this event doesn't overlap
        let columnIndex = 0;
        let placed = false;

        while (!placed) {
          if (!columns[columnIndex]) {
            columns[columnIndex] = [];
            columns[columnIndex].push(event);
            placed = true;
          } else {
            // Check if this event conflicts with any event in this column
            const hasConflict = columns[columnIndex].some(columnEvent => {
              return (
                event.startTimestamp < columnEvent.endTimestamp &&
                event.endTimestamp > columnEvent.startTimestamp
              );
            });

            if (!hasConflict) {
              columns[columnIndex].push(event);
              placed = true;
            } else {
              columnIndex++;
            }
          }
        }
      });

      // Now position each event based on its column
      const columnCount = columns.length;
      const columnWidth = 98 / columnCount; // 98% total width to leave slight gap

      columns.forEach((column, colIndex) => {
        column.forEach(event => {
          positionedEvents.push({
            ...event,
            top: getEventTopPosition(event.startTimestamp, hourHeightRem),
            height: getEventHeight(event.startTimestamp, event.endTimestamp, hourHeightRem),
            width: `${columnWidth}%`,
            left: `${colIndex * columnWidth}%`,
            zIndex: 2 + colIndex, // Higher columns are "more in front"
          });
        });
      });
    }
  });

  return positionedEvents;
};

/**
 * Check if an event occurs on a specific date
 */
export const isEventOnDate = (event: Event, date: Date): boolean => {
  const compareDate = dayjs(date).startOf('day');
  const eventStartDay = dayjs(event.startTimestamp).startOf('day');
  const eventEndDay = dayjs(event.endTimestamp).startOf('day');

  // Check if the date is within the range of the event
  return (
    compareDate.isSame(eventStartDay) ||
    compareDate.isSame(eventEndDay) ||
    (compareDate.isAfter(eventStartDay) && compareDate.isBefore(eventEndDay))
  );
};

/**
 * Check if an event spans multiple days
 */
export const isMultiDayEvent = (event: Event): boolean => {
  const eventStartDay = dayjs(event.startTimestamp).startOf('day');
  const eventEndDay = dayjs(event.endTimestamp).startOf('day');

  // Either explicitly marked as multi-day or spans multiple days
  return !!event.isMultiDay || !eventStartDay.isSame(eventEndDay, 'day');
};

/**
 * Create default event data for a given date and hour
 */
export const createDefaultEventData = (date: Date, hour: number): EventFormData => {
  // Set start time to the given hour on the given date
  const startDate = dayjs(date).hour(hour).minute(0).second(0).millisecond(0);
  // Set end time to DEFAULT_EVENT_DURATION hours later
  const endDate = startDate.add(DEFAULT_EVENT_DURATION, 'hour');

  return {
    name: '',
    startTimestamp: startDate.valueOf(),
    endTimestamp: endDate.valueOf(),
    isMultiDay: false,
  };
};

/**
 * Convert form data to an Event object
 */
export const formDataToEvent = (formData: EventFormData): Event => {
  if (!formData.id || !formData.startTimestamp || !formData.endTimestamp) {
    throw new Error('Invalid form data');
  }

  return {
    id: formData.id,
    name: formData.name,
    startTimestamp: formData.startTimestamp,
    endTimestamp: formData.endTimestamp,
    isMultiDay: !!formData.isMultiDay,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    type: formData.type || 'personal',
  };
};

/**
 * Formats a date for use in API calls
 */
export const formatDateForApi = (date: Date): string => {
  return dayjs(date).format(DATE_FORMAT);
};
