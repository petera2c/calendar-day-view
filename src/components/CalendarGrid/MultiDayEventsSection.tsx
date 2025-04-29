import React from 'react';
import dayjs from 'dayjs';
import { Event } from '../../types/Event';
import { getEventTypeColors } from '../../utils/eventColors';
import WeekDay from '../../types/WeekDay';

// Interface for processed multi-day events with grid positioning
interface ProcessedMultiDayEvent extends Event {
  gridRowStart: number; // Which row in the all-day section grid this event should be placed
  gridRowEnd: number; // End row (exclusive)
  gridColumnStart: number; // Which day column this event starts
  gridColumnEnd: number; // Which day column this event ends (exclusive)
}

interface ProcessedMultiDayEventsResult {
  events: ProcessedMultiDayEvent[];
  rowCount: number;
}

interface MultiDayEventsSectionProps {
  weekDays: WeekDay[];
  processedMultiDayEvents: ProcessedMultiDayEventsResult;
  onEventClick: (event: Event, e: React.MouseEvent) => void;
}

const MultiDayEventsSection: React.FC<MultiDayEventsSectionProps> = ({
  weekDays,
  processedMultiDayEvents,
  onEventClick,
}) => {
  return (
    <>
      {/* All-day section label */}
      <div className="time-column border-r border-b border-gray-200 text-xs text-gray-500 p-1 flex items-center justify-end row-start-2 col-start-1">
        <span>All-day</span>
      </div>
      {/* All-day section with multi-day events */}
      <div
        className="grid border-b border-gray-200 row-start-2 col-start-2 col-span-7"
        style={{
          gridTemplateColumns: 'repeat(7, 1fr)',
          gridTemplateRows:
            processedMultiDayEvents.rowCount > 0
              ? `repeat(${processedMultiDayEvents.rowCount}, 40px)`
              : '40px',
          minHeight: '40px',
        }}
      >
        {/* Background grid cells for day columns */}
        {Array.from({ length: 7 * Math.max(processedMultiDayEvents.rowCount, 1) }).map((_, idx) => {
          const colIdx = idx % 7;
          const isToday = dayjs(weekDays[colIdx].date).isSame(dayjs(), 'day');
          return (
            <div
              key={`all-day-cell-${idx}`}
              className={`h-full ${colIdx < 6 ? 'border-r border-gray-200' : ''} ${
                isToday ? 'bg-blue-50/50' : ''
              }`}
              style={{
                gridRowStart: Math.floor(idx / 7) + 1,
                gridColumnStart: (idx % 7) + 1,
              }}
            />
          );
        })}

        {/* Render multi-day events using CSS Grid positioning */}
        {processedMultiDayEvents.events.map(event => {
          const colors = getEventTypeColors(event.type);
          return (
            <div
              key={`multi-day-event-${event.id}`}
              className={`${colors.backgroundColor} border-l-4 ${colors.borderColor} ${colors.textColor} px-2 py-1 rounded-md overflow-hidden cursor-pointer hover:opacity-80 transition-colors text-sm flex items-center h-[30px] m-[4px_2px]`}
              style={{
                gridRowStart: event.gridRowStart,
                gridRowEnd: event.gridRowEnd,
                gridColumnStart: event.gridColumnStart,
                gridColumnEnd: event.gridColumnEnd,
              }}
              onClick={e => onEventClick(event, e)}
            >
              <div className="truncate font-medium">{event.name}</div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default MultiDayEventsSection;
