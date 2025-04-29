import { Event } from './Event';

/**
 * Interface for processed event with positioning information
 */
interface PositionedEvent extends Event {
  top: string;
  height: string;
  width: string;
  left: string;
  zIndex: number;
}

export default PositionedEvent;
