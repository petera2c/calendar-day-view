import React, { useMemo } from 'react';
import dayjs from 'dayjs';
import { Event } from '../../types/event';
import { CSS_CLASSES } from '../../constants';
import { useRecoilState, useSetRecoilState } from 'recoil';
import {
  selectedEventObjectState,
  modalPositionState,
  formDataState,
  isModalOpenState,
  selectedEventState,
  isEditModeState,
} from '../../state/atoms';
import { getEventTypeColors } from '../../utils/eventColors';

interface WeekDay {
  dayName: string;
  dayNumber: number;
  date: Date;
  isToday: boolean;
}

interface ProcessedEvent extends Event {
  startIndex: number;
  endIndex: number;
  width: number;
  row: number; // Added for vertical positioning
}

interface MultiDayEventsProps {
  multiDayEvents: Event[];
  weekDays: WeekDay[];
}

const MULTI_DAY_EVENT_HEIGHT = 28; // Height in pixels for multi-day events

const MultiDayEvents: React.FC<MultiDayEventsProps> = ({ multiDayEvents, weekDays }) => {
  // Recoil state
  const [, setSelectedEventObject] = useRecoilState(selectedEventObjectState);
  const setModalPosition = useSetRecoilState(modalPositionState);
  const setFormData = useSetRecoilState(formDataState);
  const setIsModalOpen = useSetRecoilState(isModalOpenState);
  const setSelectedEventId = useSetRecoilState(selectedEventState);
  const setIsEditMode = useSetRecoilState(isEditModeState);

  // Process multi-day events to determine their positioning and handle overlaps
  const { processedEvents, maxRow } = useMemo(() => {
    const weekStart = dayjs(weekDays[0].date).startOf('day');
    const weekEnd = dayjs(weekDays[6].date).endOf('day');

    // First, process the events with their date ranges
    const events: ProcessedEvent[] = multiDayEvents.map(event => {
      const startDay = dayjs(event.startTimestamp).startOf('day');
      const endDay = dayjs(event.endTimestamp).endOf('day');

      // Calculate which days of the week this event spans
      let startIndex = 0;
      while (startIndex < 7 && !dayjs(weekDays[startIndex].date).isSame(startDay, 'day')) {
        startIndex++;
      }
      if (startIndex === 7) startIndex = 0; // Fallback if not found

      let endIndex = 6;
      if (endDay.isBefore(weekEnd)) {
        while (endIndex >= 0 && !dayjs(weekDays[endIndex].date).isSame(endDay, 'day')) {
          endIndex--;
        }
        if (endIndex < 0) endIndex = 6; // Fallback if not found
      }

      // If event starts before visible week, adjust start
      if (startDay.isBefore(weekStart)) {
        startIndex = 0;
      }

      // If event ends after visible week, adjust end
      if (endDay.isAfter(weekEnd)) {
        endIndex = 6;
      }

      return {
        ...event,
        startIndex,
        endIndex,
        width: endIndex - startIndex + 1,
        row: 0, // Initialize all rows to 0, will assign proper rows below
      };
    });

    // Sort events by start date and then by duration (longer events first)
    events.sort((a, b) => {
      // First compare start dates
      if (a.startIndex !== b.startIndex) {
        return a.startIndex - b.startIndex;
      }
      // If same start date, put longer events first
      return b.width - a.width;
    });

    // Assign rows to avoid overlaps
    let maxRow = 0;

    events.forEach(event => {
      // Find the first row where this event can fit
      let row = 0;
      let foundRow = false;

      while (!foundRow) {
        // Check if any event in this row overlaps with current event
        const overlapping = events.some(
          otherEvent =>
            otherEvent.row === row &&
            otherEvent !== event &&
            Math.max(event.startIndex, otherEvent.startIndex) <=
              Math.min(event.endIndex, otherEvent.endIndex)
        );

        if (!overlapping) {
          foundRow = true;
          event.row = row;
          maxRow = Math.max(maxRow, row);
        } else {
          row++;
        }
      }
    });

    return {
      processedEvents: events,
      maxRow: maxRow + 1, // +1 because rows are 0-indexed
    };
  }, [multiDayEvents, weekDays]);

  const handleEventClick = (event: Event, e: React.MouseEvent, dayIndex: number) => {
    // Get the event element
    const eventEl = e.currentTarget as HTMLElement;
    const cellRect = eventEl.getBoundingClientRect();

    // Set the selected event
    setSelectedEventObject(event);

    // Set form data
    setFormData({
      id: event.id,
      name: event.name,
      startTimestamp: event.startTimestamp,
      endTimestamp: event.endTimestamp,
      isMultiDay: event.isMultiDay,
    });

    // Set modal state
    setSelectedEventId(event.id);
    setIsEditMode(true);

    // Set position and open modal
    setModalPosition({
      x: 0,
      y: 0,
      cellRect,
      dayIndex,
    });
    setIsModalOpen(true);
  };

  if (multiDayEvents.length === 0) {
    return null;
  }

  return (
    <>
      {/* Label for multi-day events area */}
      <div className="border-r border-b border-gray-200 text-xs text-gray-500 p-1 flex items-center justify-end">
        <span>All-day</span>
      </div>

      {/* Multi-day events container */}
      <div
        className="grid grid-cols-7 border-b border-gray-200 relative"
        style={{
          minHeight: `${maxRow * MULTI_DAY_EVENT_HEIGHT}px`,
        }}
      >
        {/* Create grid columns for the days of the week */}
        {weekDays.map((day, index) => (
          <div
            key={`multi-day-column-${index}`}
            className={`${index < 6 ? 'border-r border-gray-200' : ''}`}
          />
        ))}

        {/* Render multi-day events */}
        {processedEvents.map(event => {
          const colors = getEventTypeColors(event.type);
          return (
            <div
              key={`multi-day-event-${event.id}`}
              className={`absolute ${colors.backgroundColor} border-l-4 ${colors.borderColor} ${colors.textColor} px-2 py-1 rounded-md m-1 overflow-hidden cursor-pointer hover:opacity-80 transition-colors text-sm`}
              style={{
                left: `${(event.startIndex / 7) * 100}%`,
                width: `calc(${(event.width / 7) * 100}% - 8px)`,
                top: `${event.row * MULTI_DAY_EVENT_HEIGHT}px`,
                height: `${MULTI_DAY_EVENT_HEIGHT - 2}px`,
                zIndex: 10,
              }}
              onClick={e => handleEventClick(event, e, event.startIndex)}
            >
              <div className="truncate font-medium">{event.name}</div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default MultiDayEvents;
