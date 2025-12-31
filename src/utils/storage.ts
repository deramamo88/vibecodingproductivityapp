import {
  Task,
  Habit,
  HabitLog,
  Goal,
  Milestone,
  TimerSession,
  TimerSettings,
} from '../types';

// Generic storage functions
function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading ${key} from storage:`, error);
    return defaultValue;
  }
}

function setToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing ${key} to storage:`, error);
  }
}

// Tasks
export const getTasks = (): Task[] => getFromStorage('tasks', []);
export const saveTasks = (tasks: Task[]): void => setToStorage('tasks', tasks);

// Habits
export const getHabits = (): Habit[] => getFromStorage('habits', []);
export const saveHabits = (habits: Habit[]): void => setToStorage('habits', habits);

export const getHabitLogs = (): HabitLog[] => getFromStorage('habitLogs', []);
export const saveHabitLogs = (logs: HabitLog[]): void => setToStorage('habitLogs', logs);

// Goals
export const getGoals = (): Goal[] => getFromStorage('goals', []);
export const saveGoals = (goals: Goal[]): void => setToStorage('goals', goals);

export const getMilestones = (): Milestone[] => getFromStorage('milestones', []);
export const saveMilestones = (milestones: Milestone[]): void =>
  setToStorage('milestones', milestones);

// Timer
export const getTimerSessions = (): TimerSession[] =>
  getFromStorage('timerSessions', []);
export const saveTimerSessions = (sessions: TimerSession[]): void =>
  setToStorage('timerSessions', sessions);

export const getTimerSettings = (): TimerSettings =>
  getFromStorage('timerSettings', {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    sessionsBeforeLongBreak: 4,
    autoStartBreaks: false,
    autoStartWork: false,
    soundEnabled: true,
  });

export const saveTimerSettings = (settings: TimerSettings): void =>
  setToStorage('timerSettings', settings);

// Helper to generate unique IDs
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
