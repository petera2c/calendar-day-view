import React from 'react';
import dayjs from 'dayjs';
import { CSS_CLASSES } from '../../constants';
import { useRecoilState } from 'recoil';
import { selectedDateState } from '../../state/atoms';

interface WeekDay {
  dayName: string;
  dayNumber: number;
  date: Date;
  isToday: boolean;
}

interface DayHeadersProps {
  weekDays: WeekDay[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

const DayHeaders: React.FC<DayHeadersProps> = ({ weekDays, selectedDate, onDateChange }) => {
  const [, setRecoilSelectedDate] = useRecoilState(selectedDateState);

  const handleDayHeaderClick = (date: Date) => {
    onDateChange(date);
    setRecoilSelectedDate(date);
  };

  return (
    <div className="grid grid-cols-7 border-b border-gray-200">
      {weekDays.map((day, index) => (
        <div
          key={`day-header-${index}`}
          className={`cursor-pointer transition-colors p-2 text-center
            ${index < 6 ? 'border-r border-gray-200' : ''}
            ${
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
    </div>
  );
};

export default DayHeaders;
