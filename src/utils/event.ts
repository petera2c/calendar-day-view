import dayjs from 'dayjs';
import { Event } from '../types/Event';

/**
 * Get the hour from a timestamp (0-23)
 */
export const getHourFromTimestamp = (timestamp: number): number => {
  return dayjs(timestamp).hour() + dayjs(timestamp).minute() / 60;
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
