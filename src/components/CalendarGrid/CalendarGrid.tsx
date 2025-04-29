import React, { useMemo, useEffect, useState } from 'react';
import { Spin, Alert, message } from 'antd';
import { getWeekDays } from '../../utils/date';
import { isEventOnDate } from '../../utils/event';
import { useRecoilState, useSetRecoilState } from 'recoil';
import {
  selectedDateState,
  selectedEventObjectState,
  modalPositionState,
  isModalOpenState,
  selectedEventState,
  isEditModeState,
} from '../../state/atoms';
import dayjs from 'dayjs';
import { Event } from '../../types/Event';
import {
  createGridTemplateColumns,
  createHourHeights,
  getScrollbarWidth,
  processMultiDayEvents,
} from '../../utils/grid';
import WeekdayHeaders from './WeekdayHeaders';
import MultiDayEventsSection from './MultiDayEventsSection';
import CalendarHeader from './CalendarHeader';
import HourCells from './HourCells';
interface CalendarGridProps {
  events: Event[];
  isLoading: boolean;
  hasError: boolean;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({ events, isLoading, hasError }) => {
  // Recoil state
  const [selectedDate, setSelectedDate] = useRecoilState(selectedDateState);
  const [, setSelectedEventObject] = useRecoilState(selectedEventObjectState);
  const setModalPosition = useSetRecoilState(modalPositionState);
  const setIsModalOpen = useSetRecoilState(isModalOpenState);
  const setSelectedEvent = useSetRecoilState(selectedEventState);
  const setIsEditMode = useSetRecoilState(isEditModeState);

  const [messageApi, contextHolder] = message.useMessage();

  // State for scrollbar width
  const [scrollbarWidth, setScrollbarWidth] = useState(0);

  // Calculate scrollbar width on mount
  useEffect(() => {
    setScrollbarWidth(getScrollbarWidth());
  }, []);

  useEffect(() => {
    if (hasError) {
      messageApi.error('Error loading events');
    }
  }, [hasError]);

  // Get week days for the selected date
  const weekDays = getWeekDays(selectedDate);

  // Navigation handlers
  const handlePrevWeek = () => {
    const newDate = dayjs(selectedDate).subtract(7, 'day').toDate();
    setSelectedDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = dayjs(selectedDate).add(7, 'day').toDate();
    setSelectedDate(newDate);
  };

  const handleDayHeaderClick = (date: Date) => {
    setSelectedDate(date);
  };

  // Event click handler
  const handleEventClick = (event: Event, e: React.MouseEvent) => {
    // Get the event element
    const eventEl = e.currentTarget as HTMLElement;
    const cellRect = eventEl.getBoundingClientRect();
    const dayIndex = weekDays.findIndex(day => isEventOnDate(event, day.date));

    // Set the selected event
    setSelectedEventObject(event);

    // Set modal state
    setSelectedEvent(event);
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
    return createHourHeights(weekDays, visibleEvents);
  }, [visibleEvents, weekDays]);

  // Process multi-day events with grid positioning
  const processedMultiDayEvents = useMemo(() => {
    return processMultiDayEvents(visibleEvents, weekDays);
  }, [visibleEvents, weekDays]);

  return (
    <div className="flex-1 bg-white shadow rounded-md overflow-hidden flex flex-col min-h-0">
      {contextHolder}
      <CalendarHeader onPrevWeek={handlePrevWeek} onNextWeek={handleNextWeek} />

      {isLoading || hasError ? (
        <div className="flex justify-center items-center h-40">
          <Spin size="large" />
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Header Grid (Day headers and All-day section) */}
          <div
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

            <WeekdayHeaders
              weekDays={weekDays}
              selectedDate={selectedDate}
              onDayHeaderClick={handleDayHeaderClick}
            />

            <MultiDayEventsSection
              weekDays={weekDays}
              processedMultiDayEvents={processedMultiDayEvents}
              onEventClick={handleEventClick}
            />
          </div>

          {/* Body Grid (Hours and Events) - Scrollable, with dynamic row heights */}
          <HourCells
            weekDays={weekDays}
            visibleEvents={visibleEvents}
            hourHeights={hourHeights}
            onEventClick={handleEventClick}
          />
        </div>
      )}
    </div>
  );
};

export default CalendarGrid;
