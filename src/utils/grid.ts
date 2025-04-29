import dayjs from 'dayjs';
import { COMPACT_HOUR_HEIGHT } from '../constants/styleConstants';

import { STANDARD_HOUR_HEIGHT } from '../constants/styleConstants';
import { HOURS_IN_DAY } from '../constants/timeConstants';
import { Event } from '../types/Event';
import WeekDay from '../types/WeekDay';
import ProcessedMultiDayEvent from '../types/ProcessedMultiDayEvent';
import { isEventOnDate } from './event';
import { getHourFromTimestamp } from './event';

/**
 * Creates a CSS grid-template-columns value with appropriate sizing
 */
export interface GridTemplateColumnsOptions {
  hasFirstColumn: boolean;
  numColumns: number;
  timeColumnWidth?: string;
}

export const createGridTemplateColumns = ({
  hasFirstColumn,
  numColumns,
  timeColumnWidth = '80px',
}: GridTemplateColumnsOptions): string => {
  // For exact alignment, use calc() with percentage-based columns

  if (hasFirstColumn) {
    // Calculate the percentage width for each day column
    // We need to account for the fixed width first column
    // Each column gets equal share of the remaining space:
    // (100% - fixed_width) / numColumns

    // For multiple columns, we use calc to ensure precise division
    if (numColumns > 1) {
      const dayColumns = Array(numColumns)
        .fill(`calc((100% - ${timeColumnWidth}) / ${numColumns})`)
        .join(' ');

      return `${timeColumnWidth} ${dayColumns}`;
    }
    // Special case for a single column
    else {
      return `${timeColumnWidth} calc(100% - ${timeColumnWidth})`;
    }
  } else {
    // If there's no first column, all columns are evenly sized percentages
    // We use calc to ensure the total is exactly 100%
    if (numColumns > 1) {
      const columnCalc = `calc(100% / ${numColumns})`;
      return Array(numColumns).fill(columnCalc).join(' ');
    } else {
      return '100%'; // Single column case
    }
  }
};

/**
 * Get the width of the browser's scrollbar
 * This helps with grid alignment when one grid has a scrollbar and another doesn't
 */
export const getScrollbarWidth = (): number => {
  // Create a temporary div with scrollbar
  const outer = document.createElement('div');
  outer.style.visibility = 'hidden';
  outer.style.overflow = 'scroll';
  document.body.appendChild(outer);

  // Create an inner div that fills the outer div
  const inner = document.createElement('div');
  outer.appendChild(inner);

  // Calculate the scrollbar width
  const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;

  // Clean up
  if (outer.parentNode) {
    outer.parentNode.removeChild(outer);
  }

  return scrollbarWidth;
};

export const createHourHeights = (weekDays: WeekDay[], visibleEvents: Event[]): number[] => {
  const hoursWithEvents = new Set<number>();

  // Check each day for events
  weekDays.forEach(day => {
    // Find events for this day that are not multi-day
    const dayEvents = visibleEvents.filter(
      event => !event.isMultiDay && isEventOnDate(event, day.date)
    );

    // Mark each hour that has an event starting or ending
    dayEvents.forEach(event => {
      const startHour = getHourFromTimestamp(event.startTimestamp);
      const endHour = getHourFromTimestamp(event.endTimestamp);

      // Mark all hours this event spans
      for (let h = Math.floor(startHour); h < Math.ceil(endHour); h++) {
        if (h >= 0 && h < 24) {
          hoursWithEvents.add(h);
        }
      }

      // Also mark the hour before and after for better visual flow
      if (startHour > 0) hoursWithEvents.add(Math.floor(startHour) - 1);
      if (endHour < 23) hoursWithEvents.add(Math.ceil(endHour));
    });
  });

  // Create array of hour heights
  return Array.from({ length: HOURS_IN_DAY }, (_, hour) =>
    hoursWithEvents.has(hour) ? STANDARD_HOUR_HEIGHT : COMPACT_HOUR_HEIGHT
  );
};

export const processMultiDayEvents = (
  visibleEvents: Event[],
  weekDays: WeekDay[]
): { events: ProcessedMultiDayEvent[]; rowCount: number } => {
  const multiDayEvents = visibleEvents.filter(event => event.isMultiDay);

  if (multiDayEvents.length === 0) {
    return {
      events: [] as ProcessedMultiDayEvent[],
      rowCount: 0,
    };
  }

  const weekStart = dayjs(weekDays[0].date).startOf('day');
  const weekEnd = dayjs(weekDays[6].date).endOf('day');

  // First, calculate the span of each event in terms of grid columns
  const eventsWithSpan = multiDayEvents.map(event => {
    const startDay = dayjs(event.startTimestamp).startOf('day');
    const endDay = dayjs(event.endTimestamp).endOf('day');

    // Find the column index for start day (0-based initially)
    let startCol = 0;
    while (startCol < 7 && !dayjs(weekDays[startCol].date).isSame(startDay, 'day')) {
      startCol++;
    }
    if (startCol === 7) startCol = 0;

    // Find the column index for end day (0-based initially)
    let endCol = 6;
    if (endDay.isBefore(weekEnd)) {
      while (endCol >= 0 && !dayjs(weekDays[endCol].date).isSame(endDay, 'day')) {
        endCol--;
      }
      if (endCol < 0) endCol = 6;
    }

    // Adjust for events that extend beyond visible week
    if (startDay.isBefore(weekStart)) startCol = 0;
    if (endDay.isAfter(weekEnd)) endCol = 6;

    return {
      ...event,
      // For CSS grid columns (1-based)
      gridColumnStart: startCol + 1,
      gridColumnEnd: endCol + 2, // +2 because grid end is exclusive
    };
  });

  // Sort events by duration (longer events first) to optimize row assignment
  eventsWithSpan.sort(
    (a, b) => b.gridColumnEnd - b.gridColumnStart - (a.gridColumnEnd - a.gridColumnStart)
  );

  // Assign rows to avoid overlaps
  const rowAssignments: Record<number, boolean[]> = {};
  const result = eventsWithSpan.map(event => {
    let rowIndex = 0;
    let foundRow = false;

    // Find the first row where this event can fit
    while (!foundRow) {
      if (!rowAssignments[rowIndex]) {
        rowAssignments[rowIndex] = Array(7).fill(false); // 7 columns (7 days of the week)
      }

      let canFit = true;
      // Check if any column in this row that the event spans is already occupied
      for (let col = event.gridColumnStart - 1; col < event.gridColumnEnd - 1; col++) {
        if (rowAssignments[rowIndex][col]) {
          canFit = false;
          break;
        }
      }

      if (canFit) {
        foundRow = true;
        // Mark the columns as occupied in this row
        for (let col = event.gridColumnStart - 1; col < event.gridColumnEnd - 1; col++) {
          rowAssignments[rowIndex][col] = true;
        }
      } else {
        rowIndex++;
      }
    }

    return {
      ...event,
      // For CSS grid rows (1-based)
      gridRowStart: rowIndex + 1,
      gridRowEnd: rowIndex + 2, // +1 because grid end is exclusive
    } as ProcessedMultiDayEvent;
  });

  return {
    events: result,
    rowCount: Object.keys(rowAssignments).length,
  };
};
