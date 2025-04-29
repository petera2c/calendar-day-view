import { atom } from 'recoil';
import { EventFormData } from '../types/event';
import { Event } from '../types/event';

// Position interface for modal positioning
export interface Position {
  x: number;
  y: number;
  cellRect?: DOMRect;
  dayIndex?: number;
}

export interface ModalPosition {
  x: number;
  y: number;
  cellRect?: DOMRect;
  dayIndex?: number;
}

// Default form data
const defaultFormData: EventFormData = {
  name: '',
  startTimestamp: undefined,
  endTimestamp: undefined,
};

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
export const formDataState = atom<EventFormData>({
  key: 'formDataState',
  default: defaultFormData,
});

// Atom for selected event
export const selectedEventState = atom<string | null>({
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
  default: new Date(),
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
