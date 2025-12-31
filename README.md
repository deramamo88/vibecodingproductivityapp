# Vibe Productivity App

A comprehensive productivity application combining timer, to-do list, habit tracking, and goal-setting features.

## Features

- **Pomodoro Timer**: Focus sessions with customizable work/break intervals
- **To-Do List**: Task management with priorities, categories, and due dates
- **Habit Tracker**: Daily habit check-ins with streak tracking and visual progress
- **Goal Setting**: SMART goals with milestones and progress tracking

## Tech Stack

- React 18 with TypeScript
- Vite for fast development and building
- Local Storage for data persistence
- Lucide React for icons
- Date-fns for date utilities

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The production-ready files will be in the `dist` folder.

## Project Structure

```
src/
├── components/          # React components for each feature
│   ├── Timer/          # Pomodoro timer components
│   ├── TodoList/       # To-do list components
│   ├── HabitTracker/   # Habit tracking components
│   └── Goals/          # Goal setting components
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
│   └── storage.ts      # Local storage helpers
├── App.tsx             # Main app component
└── main.tsx            # Entry point
```

## Data Storage

All data is stored locally in your browser using LocalStorage. Your data stays private and on your device.
