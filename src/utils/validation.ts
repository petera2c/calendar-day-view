import dayjs from 'dayjs';
import { EventFormData } from '../types/Event';

/**
 * Validate event form data
 * @returns Array of error messages
 */
export const validateEventForm = (formData: EventFormData): string[] => {
  const errors: string[] = [];

  if (!formData.name || formData.name.trim() === '') {
    errors.push('Event name is required');
  }

  if (formData.startTimestamp === null || formData.startTimestamp === undefined) {
    errors.push('Start time is required');
  }

  if (formData.endTimestamp === null || formData.endTimestamp === undefined) {
    errors.push('End time is required');
  }

  const startHour = dayjs(formData.startTimestamp).hour();
  const endHour = dayjs(formData.endTimestamp).hour();

  console.log(startHour, endHour);

  if (
    formData.startTimestamp !== null &&
    formData.endTimestamp !== null &&
    formData.startTimestamp !== undefined &&
    formData.endTimestamp !== undefined &&
    startHour >= endHour
  ) {
    errors.push('End time must be after start time');
  }

  return errors;
};
