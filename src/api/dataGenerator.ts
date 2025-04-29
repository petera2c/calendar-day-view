import { Event, EventType } from '../types/Event';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { EVENT_TYPES_DATA } from './eventTypes';

// Generate a timestamp for created/updated fields
const getTimestamp = (): string => new Date().toISOString();

/**
 * Generate example demo events for the current month
 */
export const generateDemoEvents = (): Record<string, Event[]> => {
  const events: Record<string, Event[]> = {};
  const today = new Date();

  // Get current and next month for more comprehensive data
  const months = [
    { month: today.getMonth(), year: today.getFullYear() },
    { month: today.getMonth() + 1, year: today.getFullYear() },
  ];

  // Normalize second month if needed
  if (months[1].month > 11) {
    months[1].month = 0;
    months[1].year += 1;
  }

  // Generate multi-day events per week (3-5 per week)
  generateMultiDayEvents(events, today);

  // Generate 2-4 events per day for each day in the current and next month
  months.forEach(({ month, year }) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = dayjs(date).format('YYYY-MM-DD');

      // Check day of week - different events for weekdays vs weekends
      const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      // Determine how many events for this day (2-4)
      const eventsForDay = Math.floor(Math.random() * 3) + 2; // 2 to 4

      // Create events appropriate for the day
      generateDailyEvents(events, dateStr, eventsForDay, isWeekend);
    }
  });

  return events;
};

/**
 * Generate appropriate daily events based on whether it's a weekend or weekday
 */
const generateDailyEvents = (
  events: Record<string, Event[]>,
  dateStr: string,
  count: number,
  isWeekend: boolean
): void => {
  const workoutType: EventType = 'health';

  // Time slots already occupied for this day (to prevent overlaps)
  const occupiedTimeSlots: Set<number> = new Set();

  // 70% chance of an early morning workout on any day (5-7am)
  const morningWorkout = Math.random() < 0.7;
  if (morningWorkout) {
    const workoutHour = Math.floor(Math.random() * 3) + 5; // 5-7am
    createEventForDay(events, dateStr, workoutType, false, true, false, workoutHour);
    occupiedTimeSlots.add(workoutHour);
    count--;
  }

  // 15% chance of a health appointment (10am-3pm)
  const hasHealthAppointment = Math.random() < 0.15;
  if (hasHealthAppointment && count > 0) {
    // Try to find an available time slot for the appointment
    const availableSlots = getAvailableTimeSlots(10, 15, occupiedTimeSlots, 1);
    if (availableSlots.length > 0) {
      const appointmentHour = availableSlots[Math.floor(Math.random() * availableSlots.length)];
      createEventForDay(events, dateStr, 'health', false, false, true, appointmentHour);
      // Mark this slot as occupied
      occupiedTimeSlots.add(appointmentHour);
      count--;
    }
  }

  // Spread the remaining events throughout the workday (8am-6pm)
  // Based on day type (weekday vs weekend) and available time slots
  const remainingEvents: EventType[] = [];

  // Generate events based on weekday/weekend probability
  for (let i = 0; i < count; i++) {
    let eventType: EventType;

    if (isWeekend) {
      // Weekends have more education/personal development
      const rand = Math.random();
      if (rand < 0.7) {
        eventType = 'education'; // 70% education on weekends
      } else if (rand < 0.9) {
        eventType = 'work'; // 20% work on weekends
      } else {
        eventType = 'meeting'; // 10% meetings on weekends
      }
    } else {
      // Weekdays focus on work and meetings
      const rand = Math.random();
      if (rand < 0.5) {
        eventType = 'work'; // 50% work on weekdays
      } else if (rand < 0.9) {
        eventType = 'meeting'; // 40% meetings on weekdays
      } else {
        eventType = 'education'; // 10% education on weekdays
      }
    }

    remainingEvents.push(eventType);
  }

  // Distribute remaining events across the day
  const workdayStart = isWeekend ? 9 : 8; // Start at 8am on weekdays, 9am on weekends
  const workdayEnd = isWeekend ? 17 : 18; // End at 6pm on weekdays, 5pm on weekends

  // Shuffle remaining events to randomize distribution
  shuffleArray(remainingEvents);

  // Create events spread throughout the day
  for (const eventType of remainingEvents) {
    const typeData = EVENT_TYPES_DATA[eventType];
    const duration = Math.ceil(
      typeData.durations[Math.floor(Math.random() * typeData.durations.length)]
    );

    // Find available time slots for this event duration
    const availableHours = getAvailableTimeSlots(
      workdayStart,
      workdayEnd - duration + 1, // Make sure event ends before workday end
      occupiedTimeSlots,
      duration
    );

    if (availableHours.length > 0) {
      // Pick a random time slot from available hours
      const startHour = availableHours[Math.floor(Math.random() * availableHours.length)];

      // Create the event
      createEventForDay(events, dateStr, eventType as EventType, false, false, false, startHour);

      // Mark occupied slots
      for (let h = startHour; h < startHour + duration; h++) {
        occupiedTimeSlots.add(h);
      }
    }
  }
};

/**
 * Get available time slots for a given time range and duration
 */
const getAvailableTimeSlots = (
  minHour: number,
  maxHour: number,
  occupiedSlots: Set<number>,
  duration: number
): number[] => {
  const availableSlots: number[] = [];

  // Check each possible start hour
  for (let hour = minHour; hour <= maxHour; hour++) {
    let isAvailable = true;

    // Check if any hour in the duration range is occupied
    for (let h = hour; h < hour + duration; h++) {
      if (occupiedSlots.has(h)) {
        isAvailable = false;
        break;
      }
    }

    // If all hours in the range are available, add this start hour
    if (isAvailable) {
      availableSlots.push(hour);
    }
  }

  return availableSlots;
};

/**
 * Shuffle array in place
 */
const shuffleArray = <T>(array: T[]): void => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
};

/**
 * Generate multi-day events for weeks around current date
 */
const generateMultiDayEvents = (events: Record<string, Event[]>, today: Date): void => {
  // Generate multi-day events for current week and next 3 weeks
  const startingWeeks = [
    dayjs(today).startOf('week'),
    dayjs(today).add(1, 'week').startOf('week'),
    dayjs(today).add(2, 'week').startOf('week'),
    dayjs(today).add(3, 'week').startOf('week'),
  ];

  // Multi-day events are primarily work, education, and travel
  const multiDayEventTypes: EventType[] = ['work', 'education', 'travel'];

  startingWeeks.forEach(weekStart => {
    // Determine how many multi-day events for this week (2-3 to reduce overlap)
    const multiEventsForWeek = Math.floor(Math.random() * 2) + 2; // 2-3 events instead of 3-5

    // Distribute multi-day events to different days to reduce overlap
    const startDays = [];
    for (let i = 0; i < 5; i++) {
      startDays.push(i);
    }
    shuffleArray(startDays);

    for (let i = 0; i < multiEventsForWeek; i++) {
      // Use the shuffled start days array to pick a starting day
      const startDayOffset = startDays[i % startDays.length];
      const startDate = weekStart.add(startDayOffset, 'day');
      const dateStr = startDate.format('YYYY-MM-DD');

      // Random event type for this multi-day event
      const type = multiDayEventTypes[Math.floor(Math.random() * multiDayEventTypes.length)];

      // Create multi-day event with a shorter duration (1-3 days) to reduce overlap
      const durationDays = Math.floor(Math.random() * 3) + 1;
      createEventForDay(events, dateStr, type, true, false, false, undefined, durationDays);
    }
  });
};

/**
 * Create a single event for a specific day
 */
export const createEventForDay = (
  events: Record<string, Event[]>,
  dateStr: string,
  type: EventType,
  isMultiDay: boolean = false,
  isMorningWorkout: boolean = false,
  isHealthAppointment: boolean = false,
  specificHour?: number,
  customDurationDays?: number
): void => {
  const typeData = EVENT_TYPES_DATA[type];

  // Random event data from the category
  const nameIndex = Math.floor(Math.random() * typeData.names.length);
  const eventName = typeData.names[nameIndex];
  const duration = Math.ceil(typeData.durations[nameIndex]); // Round up to ensure full-hour durations

  // Initialize event
  const event: Event = {
    id: uuidv4(),
    name: eventName,
    startTimestamp: 0, // Will be set below
    endTimestamp: 0, // Will be set below
    createdAt: getTimestamp(),
    updatedAt: getTimestamp(),
    type,
  };

  if (isMultiDay) {
    // Create multi-day event
    const durationDays = customDurationDays || Math.min(duration, 5); // Use custom duration if provided
    const startDate = dayjs(dateStr).startOf('day');
    const endDate = startDate.add(durationDays, 'day').endOf('day');

    event.startTimestamp = startDate.valueOf();
    event.endTimestamp = endDate.valueOf();
    event.isMultiDay = true;
  } else {
    // Create single-day event with time
    let startHour: number;

    if (specificHour !== undefined) {
      // Use the specified hour if provided
      startHour = specificHour;
    } else if (isMorningWorkout) {
      // Morning workouts are early (5, 6, or 7am)
      startHour = Math.floor(Math.random() * 3) + 5;
    } else if (isHealthAppointment) {
      // Health appointments are mid-morning or afternoon
      startHour = Math.floor(Math.random() * 6) + 10; // 10am to 3pm
    } else {
      // Use the type's defined time ranges - always on the hour
      const { startMin, startMax } = typeData.timeRanges;
      startHour = Math.floor(Math.random() * (startMax - startMin)) + startMin;
    }

    // Ensure events are on the hour - whole number hours only
    startHour = Math.floor(startHour);

    // Duration is in whole hours
    const endHour = Math.min(startHour + duration, 23);

    // Create timestamps with minutes and seconds set to 0 for on-the-hour events
    const startDate = dayjs(dateStr).hour(startHour).minute(0).second(0);
    const endDate = dayjs(dateStr).hour(endHour).minute(0).second(0);

    event.startTimestamp = startDate.valueOf();
    event.endTimestamp = endDate.valueOf();
  }

  // Add to events map
  if (!events[dateStr]) {
    events[dateStr] = [];
  }
  events[dateStr].push(event);
};
