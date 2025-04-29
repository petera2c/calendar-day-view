/**
 * QueryKeyFactory provides a consistent way to create query keys for use with React Query.
 * This helps maintain consistent cache invalidation and query management.
 */
import dayjs from 'dayjs';

export const QueryKeys = {
  events: {
    all: ['events'],
    byDateRange: (startDate: Date, endDate: Date) => {
      const startStr = dayjs(startDate).format('YYYY-MM-DD');
      const endStr = dayjs(endDate).format('YYYY-MM-DD');
      return ['events', 'dateRange', startStr, endStr];
    },
  },
};

export default QueryKeys;
