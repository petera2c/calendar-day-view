import React, { useRef } from 'react';
import dayjs from 'dayjs';
import { Event } from '../../types/event';
import { CSS_CLASSES, HOUR_HEIGHT_REM, HOURS_IN_DAY } from '../../constants';
import { formatHour } from '../../utils/date';
import {
  getEventTopPosition,
  getEventHeight,
  isEventOnDate,
  createDefaultEventData,
} from '../../utils/event';
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

interface HourlyGridProps {
  singleDayEvents: Event[];
  weekDays: WeekDay[];
}

const HourlyGrid: React.FC<HourlyGridProps> = ({ singleDayEvents, weekDays }) => {
  // Recoil state
  const [, setSelectedEventObject] = useRecoilState(selectedEventObjectState);
  const setModalPosition = useSetRecoilState(modalPositionState);
  const setFormData = useSetRecoilState(formDataState);
  const setIsModalOpen = useSetRecoilState(isModalOpenState);
  const setSelectedEventId = useSetRecoilState(selectedEventState);
  const setIsEditMode = useSetRecoilState(isEditModeState);

  const gridRef = useRef<HTMLDivElement>(null);

  // Create an array of hours (0 to 23)
  const hours = Array.from({ length: HOURS_IN_DAY }, (_, i) => i);

  const handleCellClick = (date: Date, hour: number, e: React.MouseEvent, dayIndex: number) => {
    // Get the clicked cell element
    const cell = e.currentTarget as HTMLElement;
    const cellRect = cell.getBoundingClientRect();

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

  // Helper function to get hour from timestamp
  const getHourFromTimestamp = (timestamp: number): number => {
    return dayjs(timestamp).hour() + dayjs(timestamp).minute() / 60;
  };

  return (
    <>
      {/* Render hour labels */}
      <div className="border-r border-gray-200">
        {hours.map(hour => (
          <div
            key={`hour-label-${hour}`}
            className="h-16 border-t border-gray-200 pr-2 text-right text-sm text-gray-500 leading-none"
            style={{ paddingTop: '2px' }}
          >
            {formatHour(hour)}
          </div>
        ))}
      </div>

      {/* Render calendar grid - Week view */}
      <div ref={gridRef} className="grid grid-cols-7 w-full">
        {/* Create 7 columns for the days of the week */}
        {weekDays.map((day, dayIndex) => (
          <div
            key={`day-column-${dayIndex}`}
            className={`relative ${dayIndex < 6 ? 'border-r border-gray-200' : ''}`}
          >
            {/* Render hour cells for each day */}
            {hours.map(hour => (
              <div
                key={`cell-${dayIndex}-${hour}`}
                className={`h-16 border-t border-gray-200 cursor-pointer ${
                  dayjs(day.date).isSame(dayjs(), 'day') ? 'bg-blue-50/50' : ''
                }`}
                onClick={e => handleCellClick(day.date, hour, e, dayIndex)}
                aria-label={`Create event on ${day.dayName} at ${formatHour(hour)}`}
              />
            ))}

            {/* Render single-day events for this day */}
            <div className="absolute inset-0 pointer-events-none">
              {singleDayEvents
                .filter(event => isEventOnDate(event, day.date))
                .map(event => {
                  const startHour = getHourFromTimestamp(event.startTimestamp);
                  const endHour = getHourFromTimestamp(event.endTimestamp);
                  const colors = getEventTypeColors(event.type);

                  return (
                    <div
                      key={`event-${event.id}-${dayIndex}`}
                      className={`absolute left-0 right-0 mx-1 px-2 py-1 ${colors.backgroundColor} border-l-4 ${colors.borderColor} ${colors.textColor} overflow-hidden cursor-pointer hover:opacity-80 transition-colors pointer-events-auto rounded-r-md`}
                      style={{
                        top: getEventTopPosition(event.startTimestamp, HOUR_HEIGHT_REM),
                        height: getEventHeight(
                          event.startTimestamp,
                          event.endTimestamp,
                          HOUR_HEIGHT_REM
                        ),
                        zIndex: 10,
                      }}
                      onClick={e => handleEventClick(event, e, dayIndex)}
                    >
                      <div className="font-medium text-sm truncate">{event.name}</div>
                      <div className="text-xs">
                        {formatHour(startHour)} - {formatHour(endHour)}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default HourlyGrid;
