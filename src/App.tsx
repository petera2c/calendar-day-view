import React, { useState, useMemo } from 'react';
import { ConfigProvider } from 'antd';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { RecoilRoot } from 'recoil';
import CalendarGrid from './components/CalendarGrid/CalendarGrid';
import EventForm from './components/EventForm';
import MiniCalendar from './components/MiniCalendar';
import NewEventButton from './components/NewEventButton';
import { Event } from './types/event';
import { fetchEventsByDateRange } from './api/eventService';
import dayjs from 'dayjs';
import QueryKeys from './utils/QueryKeyFactory';
import { getWeekDays } from './utils/date';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const AppContent: React.FC = () => {
  // State for selected date
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Calculate the visible week range based on selected date
  const weekRange = useMemo(() => {
    const weekDays = getWeekDays(selectedDate);
    return {
      startDate: weekDays[0].date, // First day of the week (Sunday)
      endDate: weekDays[6].date, // Last day of the week (Saturday)
    };
  }, [selectedDate]);

  // Create a stable query key that only changes when the date range changes
  const queryKey = useMemo(() => {
    const { startDate, endDate } = weekRange;
    const startStr = dayjs(startDate).format('YYYY-MM-DD');
    const endStr = dayjs(endDate).format('YYYY-MM-DD');
    return ['events', 'dateRange', startStr, endStr];
  }, [weekRange]);

  // Fetch events for the visible week range
  const {
    data: events = [],
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey,
    queryFn: () => fetchEventsByDateRange(weekRange.startDate, weekRange.endDate),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create a custom event handler to update the selected date
  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      <main className="flex-grow flex flex-col min-h-0">
        <div className="flex gap-4 h-full p-4 overflow-hidden">
          {/* Sidebar with mini calendar */}
          <div className="flex flex-col gap-4 flex-shrink-0">
            <NewEventButton />
            <MiniCalendar selectedDate={selectedDate} onDateChange={handleDateChange} />
          </div>

          {/* Main calendar view - allow to shrink with flex-1 min-h-0 */}
          <div className="flex-1 min-h-0 flex">
            <CalendarGrid
              events={events}
              isLoading={isLoading}
              hasError={!!queryError}
              selectedDate={selectedDate}
              onDateChange={handleDateChange}
            />
          </div>
        </div>

        {/* Event form modal */}
        <EventForm events={events} />
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider>
        <RecoilRoot>
          <AppContent />
        </RecoilRoot>
      </ConfigProvider>
    </QueryClientProvider>
  );
};

export default App;
