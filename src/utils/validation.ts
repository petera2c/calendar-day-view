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

  if (!formData.startTimestamp) {
    errors.push('Start time is required');
  }

  if (!formData.endTimestamp) {
    errors.push('End time is required');
  }

  let startTimestamp = dayjs(formData.startTimestamp);
  let endTimestamp = dayjs(formData.endTimestamp);

  if (startTimestamp.isAfter(endTimestamp)) {
    errors.push('End time must be after start time');
  }
  return errors;
};
