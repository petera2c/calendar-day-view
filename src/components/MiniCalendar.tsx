import React, { useState, useEffect } from 'react';
import { Button } from 'antd';
import dayjs from 'dayjs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { MONTH_YEAR_FORMAT } from '../constants';
import { useRecoilState } from 'recoil';
import { selectedDateState } from '../state/atoms';

interface MiniCalendarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

const MiniCalendar: React.FC<MiniCalendarProps> = ({ selectedDate, onDateChange }) => {
  const [recoilSelectedDate, setRecoilSelectedDate] = useRecoilState(selectedDateState);

  const [currentMonth, setCurrentMonth] = useState<Date>(
    dayjs(selectedDate).startOf('month').toDate()
  );

  // Update current month when selectedDate changes
  useEffect(() => {
    if (!dayjs(currentMonth).isSame(selectedDate, 'month')) {
      setCurrentMonth(dayjs(selectedDate).startOf('month').toDate());
    }
  }, [selectedDate, currentMonth]);

  const handlePrevMonth = () => {
    setCurrentMonth(dayjs(currentMonth).subtract(1, 'month').toDate());
  };

  const handleNextMonth = () => {
    setCurrentMonth(dayjs(currentMonth).add(1, 'month').toDate());
  };

  const handleDateClick = (date: Date) => {
    onDateChange(date);
    setRecoilSelectedDate(date);
  };

  // Generate calendar data
  const calendarDays = React.useMemo(() => {
    const days = [];
    const today = dayjs();
    const firstDayOfMonth = dayjs(currentMonth).startOf('month');
    const lastDayOfMonth = dayjs(currentMonth).endOf('month');

    // Get the day of the week for the first day (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const firstDayOfWeek = firstDayOfMonth.day();

    // Add days from previous month to fill the first week
    const prevMonthDays = firstDayOfWeek;
    for (let i = prevMonthDays - 1; i >= 0; i--) {
      const prevMonthDay = dayjs(firstDayOfMonth).subtract(i + 1, 'day');
      days.push({
        date: prevMonthDay.toDate(),
        dayOfMonth: prevMonthDay.date(),
        isCurrentMonth: false,
        isToday: prevMonthDay.isSame(today, 'day'),
        isSelected: dayjs(selectedDate).isSame(prevMonthDay, 'day'),
      });
    }

    // Add days of the current month
    for (let i = 0; i < lastDayOfMonth.date(); i++) {
      const currentDay = dayjs(firstDayOfMonth).add(i, 'day');
      days.push({
        date: currentDay.toDate(),
        dayOfMonth: currentDay.date(),
        isCurrentMonth: true,
        isToday: currentDay.isSame(today, 'day'),
        isSelected: dayjs(selectedDate).isSame(currentDay, 'day'),
      });
    }

    // Calculate remaining cells to fill (6 weeks * 7 days = 42 cells)
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const nextMonthDay = dayjs(lastDayOfMonth).add(i, 'day');
      days.push({
        date: nextMonthDay.toDate(),
        dayOfMonth: nextMonthDay.date(),
        isCurrentMonth: false,
        isToday: nextMonthDay.isSame(today, 'day'),
        isSelected: dayjs(selectedDate).isSame(nextMonthDay, 'day'),
      });
    }

    return days;
  }, [currentMonth, selectedDate]);

  return (
    <div className="bg-white p-4 rounded-md shadow min-w-[240px]">
      <div className="flex justify-between items-center mb-4">
        <Button
          type="text"
          icon={<FontAwesomeIcon icon={faChevronLeft} />}
          onClick={handlePrevMonth}
          aria-label="Previous month"
        />
        <span className="font-semibold">{dayjs(currentMonth).format(MONTH_YEAR_FORMAT)}</span>
        <Button
          type="text"
          icon={<FontAwesomeIcon icon={faChevronRight} />}
          onClick={handleNextMonth}
          aria-label="Next month"
        />
      </div>

      <div className="grid grid-cols-7 gap-1">
        {/* Day labels */}
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
          <div key={`day-label-${index}`} className="text-center text-xs font-medium text-gray-500">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {calendarDays.map((day, index) => (
          <button
            key={`day-${index}`}
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs focus:outline-none ${
              day.isSelected
                ? 'bg-blue-500 text-white'
                : day.isToday
                ? 'border border-blue-500 bg-blue-50'
                : day.isCurrentMonth
                ? 'hover:bg-gray-100'
                : 'text-gray-400 hover:bg-gray-100'
            }`}
            onClick={() => handleDateClick(day.date)}
            aria-label={`Select date: ${dayjs(day.date).format('YYYY-MM-DD')}`}
          >
            {day.dayOfMonth}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MiniCalendar;
