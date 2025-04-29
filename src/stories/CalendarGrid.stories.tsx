import type { Meta, StoryObj } from '@storybook/react';
import { RecoilRoot } from 'recoil';
import CalendarGrid from '../components/CalendarGrid/CalendarGrid';
import dayjs from 'dayjs';
import { Event, EventType } from '../types/Event';
import '../index.css';

// Mock events data
const mockEvents: Event[] = [
  {
    id: '1',
    name: 'Meeting',
    startTimestamp: dayjs().hour(10).minute(0).second(0).valueOf(),
    endTimestamp: dayjs().hour(11).minute(30).second(0).valueOf(),
    isMultiDay: false,
    createdAt: dayjs().subtract(1, 'day').toISOString(),
    updatedAt: dayjs().toISOString(),
    type: 'work' as EventType,
  },
  {
    id: '2',
    name: 'Lunch',
    startTimestamp: dayjs().hour(12).minute(0).second(0).valueOf(),
    endTimestamp: dayjs().hour(13).minute(0).second(0).valueOf(),
    isMultiDay: false,
    createdAt: dayjs().subtract(2, 'day').toISOString(),
    updatedAt: dayjs().toISOString(),
    type: 'personal' as EventType,
  },
  {
    id: '3',
    name: 'Conference',
    startTimestamp: dayjs().subtract(1, 'day').hour(9).minute(0).second(0).valueOf(),
    endTimestamp: dayjs().add(1, 'day').hour(17).minute(0).second(0).valueOf(),
    isMultiDay: true,
    createdAt: dayjs().subtract(7, 'day').toISOString(),
    updatedAt: dayjs().toISOString(),
    type: 'work' as EventType,
  },
  {
    id: '4',
    name: 'Swimming',
    startTimestamp: dayjs().add(2, 'day').hour(7).minute(0).second(0).valueOf(),
    endTimestamp: dayjs().add(2, 'day').hour(8).minute(0).second(0).valueOf(),
    isMultiDay: false,
    createdAt: dayjs().subtract(3, 'day').toISOString(),
    updatedAt: dayjs().toISOString(),
    type: 'health' as EventType,
  },
  {
    id: '5',
    name: 'Health Check',
    startTimestamp: dayjs().add(4, 'day').hour(7).minute(0).second(0).valueOf(),
    endTimestamp: dayjs().add(4, 'day').hour(9).minute(0).second(0).valueOf(),
    isMultiDay: false,
    createdAt: dayjs().subtract(10, 'day').toISOString(),
    updatedAt: dayjs().toISOString(),
    type: 'health' as EventType,
  },
  {
    id: '6',
    name: 'Design Reviews',
    startTimestamp: dayjs().add(4, 'day').hour(9).minute(0).second(0).valueOf(),
    endTimestamp: dayjs().add(4, 'day').hour(11).minute(0).second(0).valueOf(),
    isMultiDay: false,
    createdAt: dayjs().subtract(2, 'day').toISOString(),
    updatedAt: dayjs().toISOString(),
    type: 'work' as EventType,
  },
  // Events with same time
  {
    id: '7',
    name: 'Testing 1',
    startTimestamp: dayjs().add(3, 'day').hour(10).minute(0).second(0).valueOf(),
    endTimestamp: dayjs().add(3, 'day').hour(16).minute(0).second(0).valueOf(),
    isMultiDay: false,
    createdAt: dayjs().subtract(1, 'day').toISOString(),
    updatedAt: dayjs().toISOString(),
    type: 'personal' as EventType,
  },
  {
    id: '8',
    name: 'Testing 2',
    startTimestamp: dayjs().add(3, 'day').hour(10).minute(0).second(0).valueOf(),
    endTimestamp: dayjs().add(3, 'day').hour(16).minute(0).second(0).valueOf(),
    isMultiDay: false,
    createdAt: dayjs().subtract(1, 'day').toISOString(),
    updatedAt: dayjs().toISOString(),
    type: 'personal' as EventType,
  },
  {
    id: '9',
    name: 'Testing 3',
    startTimestamp: dayjs().add(4, 'day').hour(10).minute(0).second(0).valueOf(),
    endTimestamp: dayjs().add(4, 'day').hour(16).minute(0).second(0).valueOf(),
    isMultiDay: false,
    createdAt: dayjs().subtract(1, 'day').toISOString(),
    updatedAt: dayjs().toISOString(),
    type: 'personal' as EventType,
  },
];

// Wrap component with RecoilRoot for state management
const CalendarGridWithRecoil = (props: React.ComponentProps<typeof CalendarGrid>) => (
  <RecoilRoot>
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      <main className="flex-grow flex flex-col min-h-0">
        <div className="flex gap-4 h-full p-4 overflow-hidden">
          <div className="flex-1 min-h-0 flex">
            <CalendarGrid {...props} />
          </div>
        </div>
      </main>
    </div>
  </RecoilRoot>
);

const meta = {
  title: 'Calendar/CalendarGrid',
  component: CalendarGridWithRecoil,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    events: { control: 'object' },
    isLoading: { control: 'boolean' },
    hasError: { control: 'boolean' },
  },
} satisfies Meta<typeof CalendarGridWithRecoil>;

export default meta;
type Story = StoryObj<typeof meta>;

// Stories
export const Default: Story = {
  args: {
    events: mockEvents,
    isLoading: false,
    hasError: false,
  },
};

export const Loading: Story = {
  args: {
    events: [],
    isLoading: true,
    hasError: false,
  },
};

export const Error: Story = {
  args: {
    events: [],
    isLoading: false,
    hasError: true,
  },
};

export const NoEvents: Story = {
  args: {
    events: [],
    isLoading: false,
    hasError: false,
  },
};

export const SameTimeEvents: Story = {
  args: {
    events: mockEvents.filter(e => e.id === '7' || e.id === '8' || e.id === '9'),
    isLoading: false,
    hasError: false,
  },
};
