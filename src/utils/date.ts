import dayjs from 'dayjs';
import { TimeOption } from '../types/event';
import {
  DATE_FORMAT,
  MONTH_YEAR_FORMAT,
  DATE_DISPLAY_FORMAT,
  HOURS_IN_DAY,
  DAYS_IN_WEEK,
} from '../constants';

/**
 * Format a date to the application's default date format
 */
export const formatDate = (date: Date | string): string => {
  return dayjs(date).format(DATE_FORMAT);
};

/**
 * Format a date with month and year only
 */
export const formatMonthYear = (date: Date | string): string => {
  return dayjs(date).format('MMMM YYYY');
};

/**
 * Format hour in 12-hour format with AM/PM
 */
export const formatHour = (hour: number): string => {
  const h = hour % 12 || 12;
  const ampm = hour < 12 ? 'AM' : 'PM';
  return `${h} ${ampm}`;
};

/**
 * Get array of days for the week that contains the specified date
 */
export const getWeekDays = (
  date: Date
): Array<{
  date: Date;
  dayName: string;
  dayNumber: number;
  isToday: boolean;
}> => {
  const currentDate = dayjs(date);
  const weekStart = currentDate.startOf('week');

  return Array.from({ length: 7 }, (_, i) => {
    const day = weekStart.add(i, 'day');
    const isToday = day.isSame(dayjs(), 'day');

    return {
      date: day.toDate(),
      dayName: day.format('ddd'),
      dayNumber: day.date(),
      isToday,
    };
  });
};

/**
 * Get time options for select inputs (0-23 hours)
 */
export const getTimeOptions = () => {
  return Array.from({ length: HOURS_IN_DAY }, (_, i) => ({
    value: i,
    label: formatHour(i),
  }));
};

/**
 * Get the current date in the application's default format
 */
export const getCurrentDate = (): string => {
  return dayjs().format(DATE_FORMAT);
};

/**
 * Gets the current date as a string in ISO format
 */
export const getTodayISODate = (): string => {
  return dayjs().format(DATE_FORMAT);
};

/**
 * Get day of week (0-6, 0 is Sunday)
 */
export const getDayOfWeek = (date: Date): number => {
  return dayjs(date).day();
};
