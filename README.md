# Calendar Day View

A Google Calendar day view clone that allows creating, editing, and deleting events, built with React, TypeScript, Ant Design, and Tailwind CSS.

## Features

- View a full day's schedule with 24 hourly time blocks
- Create new events by clicking on empty time slots
- Edit existing events by clicking on them
- Delete events
- Responsive design

## Technologies Used

- React
- TypeScript
- Ant Design for UI components
- Tailwind CSS for styling
- Jest and React Testing Library for testing

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd calendar-day-view
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm start
```

The application will open in your browser at `http://localhost:3000`.

## Usage

- The current day is displayed at the top of the calendar
- Click on any empty time slot to begin creating a new event
- Fill in the event details in the form at the top (name, start time, end time)
- Click "Create" to save the new event
- Click on an existing event to edit its details
- Click "Update" to save changes or "Delete" to remove the event
- Click "Cancel" to exit edit mode

## Project Structure

```
calendar-day-view/
├── src/                            # Source code
│   ├── api/                        # API mocks
│   ├── components/                 # Reusable UI components
│   │   ├── CalendarGrid/           # Calendar grid component
│   │   ├── EventForm/              # Event form component
│   │   └── EventBlock/             # Event block component
│   ├── contexts/                   # React contexts
│   │   └── EventContext.tsx        # Context for event state management
│   ├── hooks/                      # Custom hooks
│   ├── types/                      # TypeScript types
│   └── utils/                      # Utility functions
│       ├── date.ts                 # Date manipulation helpers
│       └── validation.ts           # Form validation logic
├── public/                         # Static assets
└── README.md                       # Project documentation
```

## Testing

Run the test suite:

```bash
npm test
```

## Notes

- This project uses a mock API implementation to simulate backend functionality
- In a production environment, you would replace the mock API with real API calls
