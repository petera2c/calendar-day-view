import React, { useMemo } from 'react';
import dayjs from 'dayjs';
import { Event } from '../../types/Event';
import { HOURS_IN_DAY } from '../../constants/timeConstants';
import { getEventTypeColors } from '../../utils/eventColors';
import { getHourFromTimestamp, isEventOnDate } from '../../utils/event';
import { Tooltip } from 'antd';
import { createGridTemplateColumns } from '../../utils/grid';
import { hourClickedState, isEditModeState } from '../../state/atoms';
import { selectedEventState } from '../../state/atoms';
import { isModalOpenState } from '../../state/atoms';
import { modalPositionState, selectedEventObjectState } from '../../state/atoms';
import { useRecoilState } from 'recoil';
import { useSetRecoilState } from 'recoil';
import PositionedEvent from '../../types/PositionedEvent';

interface WeekDay {
  date: Date;
  dayName: string;
  dayNumber: number;
  isToday: boolean;
}

interface HourCellsProps {
  weekDays: WeekDay[];
  visibleEvents: Event[];
  hourHeights: number[];
  onEventClick: (event: Event, e: React.MouseEvent) => void;
}

const HourCells: React.FC<HourCellsProps> = ({
  weekDays,
  visibleEvents,
  hourHeights,
  onEventClick,
}) => {
  const [, setSelectedEventObject] = useRecoilState(selectedEventObjectState);
  const setModalPosition = useSetRecoilState(modalPositionState);
  const setIsModalOpen = useSetRecoilState(isModalOpenState);
  const setSelectedEvent = useSetRecoilState(selectedEventState);
  const setIsEditMode = useSetRecoilState(isEditModeState);
  const setHourClicked = useSetRecoilState(hourClickedState);

  // Calculate row positions based on varying heights
  const hourPositions = useMemo(() => {
    const positions: number[] = [0]; // Start at 0

    for (let i = 1; i < HOURS_IN_DAY; i++) {
      positions[i] = positions[i - 1] + hourHeights[i - 1];
    }

    return positions;
  }, [hourHeights]);
  // Organize events by day with positioning information, using dynamic hour heights
  const positionedEventsByDay = useMemo(() => {
    const result: Record<string, PositionedEvent[]> = {};

    // Initialize structure for all days
    weekDays.forEach(day => {
      const dateStr = dayjs(day.date).format('YYYY-MM-DD');
      result[dateStr] = [];
    });

    // Process each day's events to calculate positions
    weekDays.forEach(day => {
      const dateStr = dayjs(day.date).format('YYYY-MM-DD');

      // Get all non-multi-day events for this day
      const dayEvents = visibleEvents.filter(
        event => !event.isMultiDay && isEventOnDate(event, day.date)
      );

      // Skip if no events
      if (!dayEvents.length) return;

      // Calculate positions with custom function for dynamic heights
      const positionedEvents = dayEvents.map(event => {
        const startHour = getHourFromTimestamp(event.startTimestamp);
        const endHour = getHourFromTimestamp(event.endTimestamp);

        // Find the starting position based on our hourPositions array
        const startPos = hourPositions[Math.floor(startHour)];
        // Calculate the fractional offset for partial hours
        const startOffset =
          (startHour - Math.floor(startHour)) * hourHeights[Math.floor(startHour)];

        // Calculate the ending hour and position
        const endHourCeil = Math.min(Math.ceil(endHour), 23);
        let endPos = hourPositions[endHourCeil];
        // If it ends exactly on the hour, use that position, otherwise add fraction
        if (endHourCeil > endHour) {
          endPos =
            hourPositions[Math.floor(endHour)] +
            (endHour - Math.floor(endHour)) * hourHeights[Math.floor(endHour)];
        }

        // Calculate height based on difference between positions
        const height = endPos - (startPos + startOffset);

        return {
          ...event,
          top: `${startPos + startOffset}rem`,
          height: `${height}rem`,
          width: '95%', // Default width
          left: '0%',
          zIndex: 1,
        } as PositionedEvent;
      });

      // Sort by start time
      const sortedEvents = [...positionedEvents].sort((a, b) => {
        const aStartHour = getHourFromTimestamp(a.startTimestamp);
        const bStartHour = getHourFromTimestamp(b.startTimestamp);
        const aEndHour = getHourFromTimestamp(a.endTimestamp);
        const bEndHour = getHourFromTimestamp(b.endTimestamp);

        if (aStartHour !== bStartHour) return aStartHour - bStartHour;
        return bEndHour - aEndHour;
      });

      // Group events that overlap in time
      const collisionGroups: PositionedEvent[][] = [];

      sortedEvents.forEach(event => {
        let foundGroup = false;
        const eventStartHour = getHourFromTimestamp(event.startTimestamp);
        const eventEndHour = getHourFromTimestamp(event.endTimestamp);

        for (const group of collisionGroups) {
          const eventOverlapsWithGroup = group.some(groupEvent => {
            const groupStartHour = getHourFromTimestamp(groupEvent.startTimestamp);
            const groupEndHour = getHourFromTimestamp(groupEvent.endTimestamp);
            return eventStartHour < groupEndHour && eventEndHour > groupStartHour;
          });

          if (eventOverlapsWithGroup) {
            group.push(event);
            foundGroup = true;
            break;
          }
        }

        if (!foundGroup) {
          collisionGroups.push([event]);
        }
      });

      // Assign column positions to overlapping events
      const finalPositionedEvents: PositionedEvent[] = [];

      collisionGroups.forEach(group => {
        if (group.length === 1) {
          finalPositionedEvents.push(group[0]);
        } else {
          // Multiple events - assign columns
          const columns: PositionedEvent[][] = [];

          group.forEach(event => {
            let columnIndex = 0;
            let placed = false;
            const eventStartHour = getHourFromTimestamp(event.startTimestamp);
            const eventEndHour = getHourFromTimestamp(event.endTimestamp);

            while (!placed) {
              if (!columns[columnIndex]) {
                columns[columnIndex] = [];
                columns[columnIndex].push(event);
                placed = true;
              } else {
                const hasConflict = columns[columnIndex].some(columnEvent => {
                  const colEventStartHour = getHourFromTimestamp(columnEvent.startTimestamp);
                  const colEventEndHour = getHourFromTimestamp(columnEvent.endTimestamp);
                  return eventStartHour < colEventEndHour && eventEndHour > colEventStartHour;
                });

                if (!hasConflict) {
                  columns[columnIndex].push(event);
                  placed = true;
                } else {
                  columnIndex++;
                }
              }
            }
          });

          // Now position each event based on its column
          const columnCount = columns.length;
          const columnWidth = 98 / columnCount;

          columns.forEach((column, colIndex) => {
            column.forEach(event => {
              finalPositionedEvents.push({
                ...event,
                width: `${columnWidth}%`,
                left: `${colIndex * columnWidth}%`,
                zIndex: 2 + colIndex,
              });
            });
          });
        }
      });

      result[dateStr] = finalPositionedEvents;
    });

    return result;
  }, [visibleEvents, weekDays, hourPositions, hourHeights]);

  // Create array of hours for the day
  const hours = Array.from({ length: HOURS_IN_DAY }, (_, i) => i);

  // Calculate total calendar height
  const totalCalendarHeight = useMemo(() => {
    return hourHeights.reduce((sum, height) => sum + height, 0);
  }, [hourHeights]);

  // Cell click handler
  const handleCellClick = (date: Date, hour: number, e: React.MouseEvent) => {
    // Get the clicked cell element
    const cell = e.currentTarget as HTMLElement;
    const cellRect = cell.getBoundingClientRect();
    const dayIndex = weekDays.findIndex(day => dayjs(day.date).isSame(date, 'day'));

    // Set modal state
    setIsEditMode(false);
    setSelectedEvent(null);
    setSelectedEventObject(null);
    setHourClicked(hour);
    // Set position and open modal
    setModalPosition({
      x: 0,
      y: 0,
      cellRect,
      dayIndex,
    });
    setIsModalOpen(true);
  };

  return (
    <div className="flex-1 overflow-auto min-h-0">
      <div
        className="w-full relative"
        style={{
          display: 'grid',
          gridTemplateColumns: createGridTemplateColumns({
            hasFirstColumn: true,
            numColumns: weekDays.length,
          }),
          height: `${totalCalendarHeight}rem`,
        }}
      >
        {/* Hour labels - always in first column */}
        {hours.map(hour => (
          <div
            key={`hour-label-${hour}`}
            className={`time-column border-r border-gray-200 pr-2 text-right text-sm text-gray-500 pt-[2px] sticky left-0 bg-white z-10 ${
              hour !== 0 ? 'border-t' : ''
            }`}
            style={{
              position: 'absolute',
              top: `${hourPositions[hour]}rem`,
              height: `${hourHeights[hour]}rem`,
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'flex-end',
              width: '80px',
            }}
          >
            {formatHour(hour)}
          </div>
        ))}

        {/* Day columns */}
        {weekDays.map((day, dayIndex) => (
          <div
            key={`day-column-${dayIndex}`}
            className="relative"
            style={{
              gridColumnStart: dayIndex + 2, // +2 because of hour labels column
              gridRowStart: 1,
              height: '100%',
            }}
          >
            {/* Hour cells for background - use dynamic heights */}
            {hours.map(hour => (
              <div
                key={`cell-${dayIndex}-${hour}`}
                className={`absolute w-full border-gray-200 ${
                  dayIndex < 6 ? 'border-r border-gray-200' : ''
                } ${dayjs(day.date).isSame(dayjs(), 'day') ? 'bg-blue-50/50' : ''} ${
                  hour !== 0 ? 'border-t' : ''
                }`}
                style={{
                  top: `${hourPositions[hour]}rem`,
                  height: `${hourHeights[hour]}rem`,
                  left: 0,
                }}
                onClick={e => handleCellClick(day.date, hour, e)}
              />
            ))}

            {/* Positioned events */}
            {positionedEventsByDay[dayjs(day.date).format('YYYY-MM-DD')]?.map(event => {
              const colors = getEventTypeColors(event.type);
              const startHour = getHourFromTimestamp(event.startTimestamp);
              const endHour = getHourFromTimestamp(event.endTimestamp);

              return (
                <div
                  key={`positioned-event-${event.id}`}
                  className={`absolute ${colors.backgroundColor} border-l-4 ${colors.borderColor} ${colors.textColor} px-2 py-1 rounded-md cursor-pointer hover:opacity-90 transition-colors`}
                  style={{
                    top: event.top,
                    height: event.height,
                    width: event.width,
                    left: event.left,
                    zIndex: event.zIndex,
                    overflow: 'hidden',
                    minHeight: '1.5rem',
                  }}
                  onClick={e => onEventClick(event, e)}
                >
                  <Tooltip title={event.name}>
                    <div className="font-medium text-sm truncate">{event.name}</div>
                  </Tooltip>
                  <Tooltip title={`${formatHour(startHour)} - ${formatHour(endHour)}`}>
                    <div className="text-xs text-ellipsis whitespace-nowrap">
                      {formatHour(startHour)} - {formatHour(endHour)}
                    </div>
                  </Tooltip>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

// Helper function duplicated from the original component to maintain the exact same formatting
const formatHour = (hour: number): string => {
  const h = hour % 12 || 12;
  const ampm = hour < 12 ? 'AM' : 'PM';
  return `${h} ${ampm}`;
};

export default HourCells;
