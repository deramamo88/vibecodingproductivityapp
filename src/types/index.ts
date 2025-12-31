// Task types
export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  category?: string;
  dueDate?: string;
  createdAt: string;
}

// Habit types
export interface Habit {
  id: string;
  name: string;
  description?: string;
  frequency: 'daily' | 'weekly';
  createdAt: string;
  color: string;
}

export interface HabitLog {
  habitId: string;
  date: string;
  completed: boolean;
}

// Goal types
export interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  targetDate: string;
  createdAt: string;
  status: 'active' | 'completed' | 'archived';
  progress: number; // 0-100
}

export interface Milestone {
  id: string;
  goalId: string;
  title: string;
  completed: boolean;
  dueDate?: string;
}

// Timer types
export interface TimerSession {
  id: string;
  type: 'work' | 'break' | 'longBreak';
  duration: number; // in seconds
  startTime: string;
  endTime?: string;
  completed: boolean;
}

export interface TimerSettings {
  workDuration: number; // in minutes
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsBeforeLongBreak: number;
  autoStartBreaks: boolean;
  autoStartWork: boolean;
  soundEnabled: boolean;
}
