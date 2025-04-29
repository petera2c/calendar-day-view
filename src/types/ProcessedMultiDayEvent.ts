import { Event } from './Event';

// Interface for processed multi-day events with grid positioning
interface ProcessedMultiDayEvent extends Event {
  gridRowStart: number; // Which row in the all-day section grid this event should be placed
  gridRowEnd: number; // End row (exclusive)
  gridColumnStart: number; // Which day column this event starts
  gridColumnEnd: number; // Which day column this event ends (exclusive)
}

export default ProcessedMultiDayEvent;
