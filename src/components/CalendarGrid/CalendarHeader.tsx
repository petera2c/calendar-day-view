import React from 'react';
import dayjs from 'dayjs';
import { MONTH_YEAR_FORMAT } from '../../constants/formatConstants';
import { Button } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useRecoilState } from 'recoil';
import { selectedDateState } from '../../state/atoms';

interface CalendarHeaderProps {
  onPrevWeek: () => void;
  onNextWeek: () => void;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({ onPrevWeek, onNextWeek }) => {
  const [selectedDate, setSelectedDate] = useRecoilState(selectedDateState);

  const handleTodayClick = () => {
    const today = dayjs();
    setSelectedDate(today.toDate());
  };
  return (
    <>
      {/* Navigation controls */}
      <div className="flex-shrink-0 flex justify-between items-center p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Button
            type="text"
            icon={<FontAwesomeIcon icon={faChevronLeft} />}
            onClick={onPrevWeek}
            aria-label="Previous week"
          />
          <Button
            type="text"
            icon={<FontAwesomeIcon icon={faChevronRight} />}
            onClick={onNextWeek}
            aria-label="Next week"
          />
          <Button type="text" onClick={handleTodayClick}>
            Today
          </Button>
        </div>
        <h2 className="text-lg font-semibold">{dayjs(selectedDate).format(MONTH_YEAR_FORMAT)}</h2>
      </div>
    </>
  );
};

export default CalendarHeader;
