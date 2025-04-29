import React, { useMemo } from 'react';
import { ConfigProvider, message } from 'antd';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { RecoilRoot, useRecoilValue } from 'recoil';
import CalendarGrid from './components/CalendarGrid/CalendarGrid';
import EventForm from './components/EventForm';
import MiniCalendar from './components/MiniCalendar';
import NewEventButton from './components/NewEventButton';
import { fetchEventsByDateRange } from './api/eventService';
import { getWeekDays } from './utils/date';
import { selectedDateState } from './state/atoms';
import QueryKeys from './utils/QueryKeyFactory';
import { QUERY_CLIENT_OPTIONS } from './constants/queryConstants';

// Create a client with default options from constants
const queryClient = new QueryClient(QUERY_CLIENT_OPTIONS);

const AppContent: React.FC = () => {
  // State for selected date
  const selectedDate = useRecoilValue(selectedDateState);

  const [messageApi, contextHolder] = message.useMessage();

  // Calculate the visible week range based on selected date
  const weekRange = useMemo(() => {
    const weekDays = getWeekDays(selectedDate);
    return {
      startDate: weekDays[0].date, // First day of the week (Sunday)
      endDate: weekDays[6].date, // Last day of the week (Saturday)
    };
  }, [selectedDate]);

  // Get query key from the QueryKeyFactory
  const queryKey = useMemo(() => {
    return QueryKeys.events.byDateRange(weekRange.startDate, weekRange.endDate);
  }, [weekRange]);

  // Fetch events for the visible week range
  const {
    data: events = [],
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey,
    queryFn: () => fetchEventsByDateRange(weekRange.startDate, weekRange.endDate),
  });

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      <main className="flex-grow flex flex-col min-h-0">
        <div className="flex gap-4 h-full p-4 overflow-hidden">
          {/* Sidebar with mini calendar */}
          <div className="flex flex-col gap-4 flex-shrink-0">
            <NewEventButton />
            <MiniCalendar selectedDate={selectedDate} />
          </div>

          {/* Main calendar view - allow to shrink with flex-1 min-h-0 */}
          <div className="flex-1 min-h-0 flex">
            <CalendarGrid events={events} isLoading={isLoading} hasError={!!queryError} />
          </div>
        </div>

        {/* Event form modal */}
        <EventForm />
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
