import { EventType } from '../types/Event';

/**
 * Event type display definitions
 */

type EventTypeData = {
  names: string[];
  durations: number[];
  timeRanges: {
    startMin: number;
    startMax: number;
  };
  suitableForMultiDay: boolean;
};

export const EVENT_TYPES_DATA: Record<EventType, EventTypeData> = {
  work: {
    names: [
      'Project Deadline',
      'Team Meeting',
      'Client Review',
      'Product Launch',
      'Sprint Planning',
      'Code Review',
      'Release Deployment',
      'Status Update',
      'Quarterly Review',
      'Roadmap Planning',
    ],
    durations: [2, 1, 2, 4, 2, 1, 3, 1, 2, 3],
    timeRanges: {
      startMin: 8, // 8am
      startMax: 16, // 4pm
    },
    suitableForMultiDay: true,
  },
  personal: {
    names: [
      'Personal Development',
      'Career Planning',
      'Performance Review',
      'Resume Update',
      'Professional Reading',
      'Network Outreach',
      'Industry Research',
      'Email Catch-up',
      'Documentation Review',
      'Portfolio Update',
    ],
    durations: [2, 3, 1, 2, 2, 1, 2, 1, 2, 2],
    timeRanges: {
      startMin: 9, // 9am
      startMax: 19, // 7pm
    },
    suitableForMultiDay: false,
  },
  meeting: {
    names: [
      'Weekly Sync',
      'One-on-One',
      'Design Review',
      'Strategy Meeting',
      'Stakeholder Call',
      'Investor Meeting',
      'Board Meeting',
      'Planning Session',
      'Interview',
      'Team Retrospective',
    ],
    durations: [1, 1, 2, 2, 1, 2, 3, 2, 1, 2],
    timeRanges: {
      startMin: 9, // 9am
      startMax: 16, // 4pm
    },
    suitableForMultiDay: false,
  },
  social: {
    names: [
      'Networking Event',
      'Industry Mixer',
      'Team Lunch',
      'Client Dinner',
      'Mentoring Session',
      'Team Building',
      'Charity Event',
      'Business Lunch',
      'Professional Meetup',
      'Award Ceremony',
    ],
    durations: [2, 3, 1, 3, 1, 2, 4, 2, 3, 2],
    timeRanges: {
      startMin: 11, // 11am
      startMax: 19, // 7pm
    },
    suitableForMultiDay: false,
  },
  health: {
    names: [
      'Doctor Appointment',
      'Gym Workout',
      'Morning Run',
      'Yoga Session',
      'Fitness Training',
      'Dentist Appointment',
      'Physical Therapy',
      'Health Checkup',
      'CrossFit',
      'Swimming',
    ],
    durations: [1, 1, 1, 1, 1, 1, 1, 2, 1, 1],
    timeRanges: {
      startMin: 5, // 5am
      startMax: 19, // 7pm
    },
    suitableForMultiDay: false,
  },
  travel: {
    names: [
      'Business Trip',
      'Conference',
      'Workshop',
      'Training',
      'Team Retreat',
      'Client Visit',
      'Trade Show',
      'Industry Convention',
      'Sales Trip',
      'Company Offsite',
    ],
    durations: [3, 3, 2, 2, 3, 2, 3, 3, 2, 3],
    timeRanges: {
      startMin: 6, // 6am
      startMax: 18, // 6pm
    },
    suitableForMultiDay: true,
  },
  education: {
    names: [
      'Online Course',
      'Training Workshop',
      'Certification Exam',
      'Study Session',
      'Webinar',
      'Professional Conference',
      'Research Session',
      'Mentoring Session',
      'Skill Development',
      'Professional Development',
    ],
    durations: [2, 4, 3, 2, 1, 6, 2, 1, 2, 3],
    timeRanges: {
      startMin: 8, // 8am
      startMax: 17, // 5pm
    },
    suitableForMultiDay: true,
  },
};
