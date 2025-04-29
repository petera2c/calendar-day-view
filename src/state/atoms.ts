import { atom } from 'recoil';
import { EventFormData } from '../types/Event';
import { Event } from '../types/Event';
import dayjs from 'dayjs';
import Position from '../types/Position';

// Atom for modal visibility
export const isModalOpenState = atom<boolean>({
  key: 'isModalOpenState',
  default: false,
});

// Atom for modal position
export const modalPositionState = atom<Position | null>({
  key: 'modalPositionState',
  default: null,
});

// Atom for form data
export const timestampClickedState = atom<number>({
  key: 'timestampClickedState',
  default: dayjs().valueOf(),
});

// Atom for selected event
export const selectedEventState = atom<Event | null>({
  key: 'selectedEventState',
  default: null,
});

// Atom for the full selected event object
export const selectedEventObjectState = atom<Event | null>({
  key: 'selectedEventObjectState',
  default: null,
});

// Atom for the selected date
export const selectedDateState = atom<Date>({
  key: 'selectedDateState',
  default: dayjs().toDate(),
});

// Atom to track if the form is in edit mode
export const isEditModeState = atom<boolean>({
  key: 'isEditModeState',
  default: false,
});

// Atom to track if we're transitioning the modal position
export const isTransitioningState = atom<boolean>({
  key: 'isTransitioningState',
  default: false,
});
