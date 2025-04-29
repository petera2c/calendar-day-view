export interface Event {
  id: string;
  name: string;
  date: string;
  startTime: number;
  endTime: number;
  endDate?: string;
  isMultiDay?: boolean;
  createdAt: string;
  updatedAt: string;
  type?: string; // Added type property for event categorization
}

export interface EventFormData {
  id?: string;
  name: string;
  date: string;
  startTime?: number;
  endTime?: number;
  endDate?: string;
  isMultiDay?: boolean;
  type?: string; // Added type property for event categorization
}

export interface ModalPosition {
  x: number;
  y: number;
  cellRect: DOMRect;
  dayIndex: number;
}

export type WeekDay = {
  dayName: string;
  dayNumber: number;
  date: Date;
  isToday: boolean;
};
