import React from 'react';
import dayjs from 'dayjs';
import { HOUR_HEIGHT_REM } from '../../constants/timeConstants';

interface CurrentTimeIndicatorProps {
  weekDays: Array<{
    date: Date;
    dayName: string;
    dayNumber: number;
    isToday: boolean;
  }>;
}

const CurrentTimeIndicator: React.FC<CurrentTimeIndicatorProps> = ({ weekDays }) => {
  const now = dayjs();
  const currentHour = now.hour() + now.minute() / 60;

  // Find today's index in the week
  const todayIndex = weekDays.findIndex(day => day.isToday);

  // Only show indicator if today is in the current week view
  if (todayIndex === -1) return null;

  return (
    <div
      className="absolute h-[2px] bg-red-500 z-20 pointer-events-none"
      style={{
        top: `${currentHour * HOUR_HEIGHT_REM}rem`,
        left: `calc(80px + ${todayIndex} * ((100% - 80px) / 7))`,
        width: `calc((100% - 80px) / 7)`,
      }}
    >
      {/* Red dot at the start of the line */}
      <div
        className="absolute w-2 h-2 rounded-full bg-red-500"
        style={{
          left: '-4px',
          top: '-4px',
        }}
      />
    </div>
  );
};

export default CurrentTimeIndicator;
