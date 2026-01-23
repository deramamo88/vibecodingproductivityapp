import {
  Task,
  Habit,
  HabitLog,
  Goal,
  Milestone,
  TimerSession,
  TimerSettings,
} from '../types';
import {
  getGoalsFromFirebase,
  saveGoalToFirebase,
  getHabitsFromFirebase,
  saveHabitToFirebase,
  getTasksFromFirebase,
  saveTaskToFirebase,
  getTimerSessionsFromFirebase,
  saveTimerSessionToFirebase,
  getHabitLogsFromFirebase,
  saveHabitLogToFirebase,
  getMilestonesFromFirebase,
  saveMilestoneToFirebase,
} from './firebaseStorage';

// Current user ID (set after login)
let currentUserId: string | null = null;

export const setCurrentUserId = (userId: string | null) => {
  currentUserId = userId;
};

export const getCurrentUserId = () => currentUserId;

// Load all data from Firebase to localStorage (called on login)
export const loadDataFromFirebase = async (userId: string): Promise<void> => {
  try {
    console.log('📥 Loading data from Firebase for user:', userId);
    const [goals, habits, tasks, sessions, habitLogs, milestones] = await Promise.all([
      getGoalsFromFirebase(userId),
      getHabitsFromFirebase(userId),
      getTasksFromFirebase(userId),
      getTimerSessionsFromFirebase(userId),
      getHabitLogsFromFirebase(userId),
      getMilestonesFromFirebase(userId),
    ]);
    console.log('✅ Loaded from Firebase:', { goals: goals.length, habits: habits.length, tasks: tasks.length });

    setToStorage('goals', goals);
    setToStorage('habits', habits);
    setToStorage('tasks', tasks);
    setToStorage('timerSessions', sessions);
    setToStorage('habitLogs', habitLogs);
    setToStorage('milestones', milestones);
  } catch (error) {
    console.error('Error loading data from Firebase:', error);
  }
};

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
export const getTasks = (): Task[] => {
  return getFromStorage('tasks', []);
};

export const saveTasks = (tasks: Task[]): void => {
  setToStorage('tasks', tasks);
  // Sync to Firebase in background if user is logged in
  if (currentUserId) {
    console.log('☁️ Syncing', tasks.length, 'tasks to Firebase for user:', currentUserId);
    Promise.all(tasks.map(task => saveTaskToFirebase(currentUserId!, task)))
      .then(() => console.log('✅ Tasks synced to Firebase'))
      .catch(err => console.error('❌ Firebase sync error:', err));
  }
};

// Habits
export const getHabits = (): Habit[] => {
  return getFromStorage('habits', []);
};

export const saveHabits = (habits: Habit[]): void => {
  setToStorage('habits', habits);
  if (currentUserId) {
    console.log('☁️ Syncing', habits.length, 'habits to Firebase for user:', currentUserId);
    Promise.all(habits.map(habit => saveHabitToFirebase(currentUserId!, habit)))
      .then(() => console.log('✅ Habits synced to Firebase'))
      .catch(err => console.error('❌ Firebase sync error:', err));
  }
};

export const getHabitLogs = (): HabitLog[] => {
  return getFromStorage('habitLogs', []);
};

export const saveHabitLogs = (logs: HabitLog[]): void => {
  setToStorage('habitLogs', logs);
  if (currentUserId) {
    Promise.all(logs.map(log => saveHabitLogToFirebase(currentUserId!, log))).catch(console.error);
  }
};

// Goals
export const getGoals = (): Goal[] => {
  return getFromStorage('goals', []);
};

export const saveGoals = (goals: Goal[]): void => {
  setToStorage('goals', goals);
  if (currentUserId) {
    console.log('☁️ Syncing', goals.length, 'goals to Firebase for user:', currentUserId);
    Promise.all(goals.map(goal => saveGoalToFirebase(currentUserId!, goal)))
      .then(() => console.log('✅ Goals synced to Firebase'))
      .catch(err => console.error('❌ Firebase sync error:', err));
  }
};

export const getMilestones = (): Milestone[] => {
  return getFromStorage('milestones', []);
};

export const saveMilestones = (milestones: Milestone[]): void => {
  setToStorage('milestones', milestones);
  if (currentUserId) {
    Promise.all(milestones.map(milestone => saveMilestoneToFirebase(currentUserId!, milestone))).catch(console.error);
  }
};

// Timer
export const getTimerSessions = (): TimerSession[] => {
  return getFromStorage('timerSessions', []);
};

export const saveTimerSessions = (sessions: TimerSession[]): void => {
  setToStorage('timerSessions', sessions);
  if (currentUserId) {
    Promise.all(sessions.map(session => saveTimerSessionToFirebase(currentUserId!, session))).catch(console.error);
  }
};

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
