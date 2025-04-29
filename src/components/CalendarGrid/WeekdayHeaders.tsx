import React from 'react';
import dayjs from 'dayjs';
import { CSS_CLASSES } from '../../constants/styleConstants';
import WeekDay from '../../types/WeekDay';

interface WeekdayHeadersProps {
  onDayHeaderClick: (date: Date) => void;
  selectedDate: Date;
  weekDays: WeekDay[];
}

const WeekdayHeaders: React.FC<WeekdayHeadersProps> = ({
  onDayHeaderClick,
  selectedDate,
  weekDays,
}) => {
  return (
    <>
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
          onClick={() => onDayHeaderClick(day.date)}
        >
          <div className="text-xs font-medium text-gray-500">{day.dayName}</div>
          <div className={`text-xl ${day.isToday ? 'text-blue-600 font-bold' : ''}`}>
            {day.dayNumber}
          </div>
        </div>
      ))}
    </>
  );
};

export default WeekdayHeaders;
