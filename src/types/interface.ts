import { Position } from '../state/atoms';

/**
 * Modal position information
 */
export interface ModalPosition {
  x: number;
  y: number;
  cellRect: DOMRect;
  dayIndex: number;
}

/**
 * Week day information
 */
export type WeekDay = {
  dayName: string;
  dayNumber: number;
  date: Date;
  isToday: boolean;
};
