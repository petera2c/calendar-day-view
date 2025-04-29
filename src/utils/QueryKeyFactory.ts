/**
 * QueryKeyFactory provides a consistent way to create query keys for use with React Query.
 * This helps maintain consistent cache invalidation and query management.
 */

export const QueryKeys = {
  events: {
    // Base key for all event-related queries
    all: ['events'] as const,

    // Query key for events in a specific month
    byMonth: (monthYear: string) => [...QueryKeys.events.all, 'month', monthYear] as const,

    // Query key for a specific event
    detail: (id: string) => [...QueryKeys.events.all, 'detail', id] as const,
  },
};

export default QueryKeys;
