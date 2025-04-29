import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Spin, Alert, Button, Tooltip } from 'antd';
import { getWeekDays, formatHour } from '../../utils/date';
import { isEventOnDate, createDefaultEventData, PositionedEvent } from '../../utils/event';
import { useRecoilState, useSetRecoilState } from 'recoil';
import {
  selectedDateState,
  selectedEventObjectState,
  modalPositionState,
  formDataState,
  isModalOpenState,
  selectedEventState,
  isEditModeState,
} from '../../state/atoms';
import dayjs from 'dayjs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { HOURS_IN_DAY, CSS_CLASSES, MONTH_YEAR_FORMAT } from '../../constants';
import { Event } from '../../types/event';
import { createGridTemplateColumns, getScrollbarWidth } from '../../utils/grid';
import { getEventTypeColors } from '../../utils/eventColors';

// Constants for row heights
const STANDARD_HOUR_HEIGHT = 4; // rem
const COMPACT_HOUR_HEIGHT = 2; // rem for empty rows

interface CalendarGridProps {
  events: Event[];
  isLoading: boolean;
  hasError: boolean;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

// Interface for processed multi-day events with grid positioning
interface ProcessedMultiDayEvent extends Event {
  gridRowStart: number; // Which row in the all-day section grid this event should be placed
  gridRowEnd: number; // End row (exclusive)
  gridColumnStart: number; // Which day column this event starts
  gridColumnEnd: number; // Which day column this event ends (exclusive)
}

const CalendarGrid: React.FC<CalendarGridProps> = ({
  events,
  isLoading,
  hasError,
  selectedDate,
  onDateChange,
}) => {
  // Recoil state
  const [, setRecoilSelectedDate] = useRecoilState(selectedDateState);
  const [, setSelectedEventObject] = useRecoilState(selectedEventObjectState);
  const setModalPosition = useSetRecoilState(modalPositionState);
  const setFormData = useSetRecoilState(formDataState);
  const setIsModalOpen = useSetRecoilState(isModalOpenState);
  const setSelectedEventId = useSetRecoilState(selectedEventState);
  const setIsEditMode = useSetRecoilState(isEditModeState);

  // Refs for grid measurement
  const headerGridRef = useRef<HTMLDivElement>(null);
  const bodyGridRef = useRef<HTMLDivElement>(null);

  // State for scrollbar width
  const [scrollbarWidth, setScrollbarWidth] = useState(0);

  // Initialize recoil state with prop value
  useEffect(() => {
    setRecoilSelectedDate(selectedDate);
  }, [selectedDate, setRecoilSelectedDate]);

  // Calculate scrollbar width on mount
  useEffect(() => {
    setScrollbarWidth(getScrollbarWidth());
  }, []);

  // Get week days for the selected date
  const weekDays = getWeekDays(selectedDate);

  // Create an array of hours (0 to 23)
  const hours = Array.from({ length: HOURS_IN_DAY }, (_, i) => i);

  // Helper function to get hour from timestamp
  const getHourFromTimestamp = (timestamp: number): number => {
    return dayjs(timestamp).hour() + dayjs(timestamp).minute() / 60;
  };

  // Navigation handlers
  const handlePrevWeek = () => {
    const newDate = dayjs(selectedDate).subtract(7, 'day').toDate();
    onDateChange(newDate);
    setRecoilSelectedDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = dayjs(selectedDate).add(7, 'day').toDate();
    onDateChange(newDate);
    setRecoilSelectedDate(newDate);
  };

  const handleTodayClick = () => {
    const today = new Date();
    onDateChange(today);
    setRecoilSelectedDate(today);
  };

  const handleDayHeaderClick = (date: Date) => {
    onDateChange(date);
    setRecoilSelectedDate(date);
  };

  // Cell click handler
  const handleCellClick = (date: Date, hour: number, e: React.MouseEvent) => {
    // Get the clicked cell element
    const cell = e.currentTarget as HTMLElement;
    const cellRect = cell.getBoundingClientRect();
    const dayIndex = weekDays.findIndex(day => dayjs(day.date).isSame(date, 'day'));

    // Create default event data for the selected hour
    const newEventData = createDefaultEventData(date, hour);

    // Update form data
    setFormData(newEventData);

    // Set modal state
    setIsEditMode(false);
    setSelectedEventId(null);
    setSelectedEventObject(null);

    // Set position and open modal
    setModalPosition({
      x: 0,
      y: 0,
      cellRect,
      dayIndex,
    });
    setIsModalOpen(true);
  };

  // Event click handler
  const handleEventClick = (event: Event, e: React.MouseEvent) => {
    // Get the event element
    const eventEl = e.currentTarget as HTMLElement;
    const cellRect = eventEl.getBoundingClientRect();
    const dayIndex = weekDays.findIndex(day => isEventOnDate(event, day.date));

    // Set the selected event
    setSelectedEventObject(event);

    // Set form data
    setFormData({
      id: event.id,
      name: event.name,
      startTimestamp: event.startTimestamp,
      endTimestamp: event.endTimestamp,
      isMultiDay: event.isMultiDay,
      type: event.type,
    });

    // Set modal state
    setSelectedEventId(event.id);
    setIsEditMode(true);

    // Set position and open modal
    setModalPosition({
      x: 0,
      y: 0,
      cellRect,
      dayIndex: dayIndex >= 0 ? dayIndex : 0,
    });
    setIsModalOpen(true);
  };

  // Filter events for the visible week
  const visibleEvents = useMemo(
    () => events.filter(event => weekDays.some(day => isEventOnDate(event, day.date))),
    [events, weekDays]
  );

  // Calculate which hours have events and should have standard height
  const hourHeights = useMemo(() => {
    const hoursWithEvents = new Set<number>();

    // Check each day for events
    weekDays.forEach(day => {
      // Find events for this day that are not multi-day
      const dayEvents = visibleEvents.filter(
        event => !event.isMultiDay && isEventOnDate(event, day.date)
      );

      // Mark each hour that has an event starting or ending
      dayEvents.forEach(event => {
        const startHour = getHourFromTimestamp(event.startTimestamp);
        const endHour = getHourFromTimestamp(event.endTimestamp);

        // Mark all hours this event spans
        for (let h = Math.floor(startHour); h < Math.ceil(endHour); h++) {
          if (h >= 0 && h < 24) {
            hoursWithEvents.add(h);
          }
        }

        // Also mark the hour before and after for better visual flow
        if (startHour > 0) hoursWithEvents.add(Math.floor(startHour) - 1);
        if (endHour < 23) hoursWithEvents.add(Math.ceil(endHour));
      });
    });

    // Create array of hour heights
    return Array.from({ length: HOURS_IN_DAY }, (_, hour) =>
      hoursWithEvents.has(hour) ? STANDARD_HOUR_HEIGHT : COMPACT_HOUR_HEIGHT
    );
  }, [visibleEvents, weekDays]);

  // Calculate row positions based on varying heights
  const hourPositions = useMemo(() => {
    const positions: number[] = [0]; // Start at 0

    for (let i = 1; i < HOURS_IN_DAY; i++) {
      positions[i] = positions[i - 1] + hourHeights[i - 1];
    }

    return positions;
  }, [hourHeights]);

  // Calculate total calendar height
  const totalCalendarHeight = useMemo(() => {
    return hourHeights.reduce((sum, height) => sum + height, 0);
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

  // Process multi-day events with grid positioning
  const processedMultiDayEvents = useMemo(() => {
    const multiDayEvents = visibleEvents.filter(event => event.isMultiDay);

    if (multiDayEvents.length === 0) {
      return {
        events: [] as ProcessedMultiDayEvent[],
        rowCount: 0,
      };
    }

    const weekStart = dayjs(weekDays[0].date).startOf('day');
    const weekEnd = dayjs(weekDays[6].date).endOf('day');

    // First, calculate the span of each event in terms of grid columns
    const eventsWithSpan = multiDayEvents.map(event => {
      const startDay = dayjs(event.startTimestamp).startOf('day');
      const endDay = dayjs(event.endTimestamp).endOf('day');

      // Find the column index for start day (0-based initially)
      let startCol = 0;
      while (startCol < 7 && !dayjs(weekDays[startCol].date).isSame(startDay, 'day')) {
        startCol++;
      }
      if (startCol === 7) startCol = 0;

      // Find the column index for end day (0-based initially)
      let endCol = 6;
      if (endDay.isBefore(weekEnd)) {
        while (endCol >= 0 && !dayjs(weekDays[endCol].date).isSame(endDay, 'day')) {
          endCol--;
        }
        if (endCol < 0) endCol = 6;
      }

      // Adjust for events that extend beyond visible week
      if (startDay.isBefore(weekStart)) startCol = 0;
      if (endDay.isAfter(weekEnd)) endCol = 6;

      return {
        ...event,
        // For CSS grid columns (1-based)
        gridColumnStart: startCol + 1,
        gridColumnEnd: endCol + 2, // +2 because grid end is exclusive
      };
    });

    // Sort events by duration (longer events first) to optimize row assignment
    eventsWithSpan.sort(
      (a, b) => b.gridColumnEnd - b.gridColumnStart - (a.gridColumnEnd - a.gridColumnStart)
    );

    // Assign rows to avoid overlaps
    const rowAssignments: Record<number, boolean[]> = {};
    const result = eventsWithSpan.map(event => {
      let rowIndex = 0;
      let foundRow = false;

      // Find the first row where this event can fit
      while (!foundRow) {
        if (!rowAssignments[rowIndex]) {
          rowAssignments[rowIndex] = Array(7).fill(false); // 7 columns (7 days of the week)
        }

        let canFit = true;
        // Check if any column in this row that the event spans is already occupied
        for (let col = event.gridColumnStart - 1; col < event.gridColumnEnd - 1; col++) {
          if (rowAssignments[rowIndex][col]) {
            canFit = false;
            break;
          }
        }

        if (canFit) {
          foundRow = true;
          // Mark the columns as occupied in this row
          for (let col = event.gridColumnStart - 1; col < event.gridColumnEnd - 1; col++) {
            rowAssignments[rowIndex][col] = true;
          }
        } else {
          rowIndex++;
        }
      }

      return {
        ...event,
        // For CSS grid rows (1-based)
        gridRowStart: rowIndex + 1,
        gridRowEnd: rowIndex + 2, // +1 because grid end is exclusive
      } as ProcessedMultiDayEvent;
    });

    return {
      events: result,
      rowCount: Object.keys(rowAssignments).length,
    };
  }, [visibleEvents, weekDays]);

  if (hasError) {
    return (
      <Alert
        message="Error"
        description="Failed to load events"
        type="error"
        showIcon
        className="mb-4"
      />
    );
  }

  return (
    <div className="flex-1 bg-white shadow rounded-md overflow-hidden flex flex-col min-h-0">
      {/* Navigation controls */}
      <div className="flex-shrink-0 flex justify-between items-center p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Button
            type="text"
            icon={<FontAwesomeIcon icon={faChevronLeft} />}
            onClick={handlePrevWeek}
            aria-label="Previous week"
          />
          <Button
            type="text"
            icon={<FontAwesomeIcon icon={faChevronRight} />}
            onClick={handleNextWeek}
            aria-label="Next week"
          />
          <Button type="text" onClick={handleTodayClick}>
            Today
          </Button>
        </div>
        <h2 className="text-lg font-semibold">{dayjs(selectedDate).format(MONTH_YEAR_FORMAT)}</h2>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <Spin size="large" />
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Header Grid (Day headers and All-day section) */}
          <div
            ref={headerGridRef}
            style={{
              gridTemplateColumns: createGridTemplateColumns({
                hasFirstColumn: true,
                numColumns: weekDays.length,
              }),
              gridTemplateRows: 'auto auto',
              position: 'relative',
              zIndex: 2,
              paddingRight: `${scrollbarWidth}px`,
            }}
            className="w-full grid flex-shrink-0"
          >
            {/* Empty top-left corner */}
            <div className="time-column border-r border-b border-gray-200"></div>

            {/* Day headers */}
            {weekDays.map((day, index) => (
              <div
                key={`day-header-${index}`}
                className={`day-column-header cursor-pointer transition-colors p-2 text-center border-b border-gray-200 ${
                  index < 6 ? 'border-r border-gray-200' : ''
                } ${
                  day.isToday
                    ? CSS_CLASSES.TODAY
                    : dayjs(day.date).isSame(selectedDate, 'day')
                    ? CSS_CLASSES.SELECTED_DAY
                    : CSS_CLASSES.HOVER_DAY
                }`}
                onClick={() => handleDayHeaderClick(day.date)}
              >
                <div className="text-xs font-medium text-gray-500">{day.dayName}</div>
                <div className={`text-xl ${day.isToday ? 'text-blue-600 font-bold' : ''}`}>
                  {day.dayNumber}
                </div>
              </div>
            ))}

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
              {Array.from({ length: 7 * Math.max(processedMultiDayEvents.rowCount, 1) }).map(
                (_, idx) => {
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
                }
              )}

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
                    onClick={e => handleEventClick(event, e)}
                  >
                    <div className="truncate font-medium">{event.name}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Body Grid (Hours and Events) - Scrollable, with dynamic row heights */}
          <div className="flex-1 overflow-auto min-h-0">
            <div
              ref={bodyGridRef}
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
                        onClick={e => handleEventClick(event, e)}
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
        </div>
      )}
    </div>
  );
};

export default CalendarGrid;
