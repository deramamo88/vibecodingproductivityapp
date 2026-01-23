import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc,
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Goal, Habit, Task, TimerSession, HabitLog, Milestone } from '../types';

// Helper to convert Firebase Timestamp to ISO string
const timestampToISO = (timestamp: any): string => {
  if (timestamp?.toDate) {
    return timestamp.toDate().toISOString();
  }
  return timestamp || new Date().toISOString();
};

// User-scoped collection helper
const getUserCollection = (userId: string, collectionName: string) => {
  return collection(db, 'users', userId, collectionName);
};

// ============= GOALS =============
export const getGoalsFromFirebase = async (userId: string): Promise<Goal[]> => {
  try {
    const goalsSnapshot = await getDocs(getUserCollection(userId, 'goals'));
    return goalsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: timestampToISO(data.createdAt),
        targetDate: data.targetDate || '',
      } as Goal;
    });
  } catch (error) {
    console.error('Error fetching goals:', error);
    return [];
  }
};

export const saveGoalToFirebase = async (userId: string, goal: Goal): Promise<void> => {
  try {
    console.log('💾 Attempting to save goal to Firebase:', { userId, goalId: goal.id });
    const goalRef = doc(db, 'users', userId, 'goals', goal.id);
    await setDoc(goalRef, {
      ...goal,
      createdAt: Timestamp.fromDate(new Date(goal.createdAt)),
      updatedAt: Timestamp.now(),
    });
    console.log('✅ Goal saved successfully');
  } catch (error) {
    console.error('❌ Error saving goal:', error);
    console.error('Full error details:', JSON.stringify(error, null, 2));
    throw error;
  }
};

export const deleteGoalFromFirebase = async (userId: string, goalId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'users', userId, 'goals', goalId));
  } catch (error) {
    console.error('Error deleting goal:', error);
    throw error;
  }
};

// ============= HABITS =============
export const getHabitsFromFirebase = async (userId: string): Promise<Habit[]> => {
  try {
    const habitsSnapshot = await getDocs(getUserCollection(userId, 'habits'));
    return habitsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: timestampToISO(data.createdAt),
      } as Habit;
    });
  } catch (error) {
    console.error('Error fetching habits:', error);
    return [];
  }
};

export const saveHabitToFirebase = async (userId: string, habit: Habit): Promise<void> => {
  try {
    const habitRef = doc(db, 'users', userId, 'habits', habit.id);
    await setDoc(habitRef, {
      ...habit,
      createdAt: Timestamp.fromDate(new Date(habit.createdAt)),
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error saving habit:', error);
    throw error;
  }
};

export const deleteHabitFromFirebase = async (userId: string, habitId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'users', userId, 'habits', habitId));
  } catch (error) {
    console.error('Error deleting habit:', error);
    throw error;
  }
};

// ============= TASKS =============
export const getTasksFromFirebase = async (userId: string): Promise<Task[]> => {
  try {
    const tasksSnapshot = await getDocs(getUserCollection(userId, 'tasks'));
    return tasksSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: timestampToISO(data.createdAt),
        dueDate: data.dueDate || '',
      } as Task;
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }
};

export const saveTaskToFirebase = async (userId: string, task: Task): Promise<void> => {
  try {
    const taskRef = doc(db, 'users', userId, 'tasks', task.id);
    await setDoc(taskRef, {
      ...task,
      createdAt: Timestamp.fromDate(new Date(task.createdAt)),
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error saving task:', error);
    throw error;
  }
};

export const deleteTaskFromFirebase = async (userId: string, taskId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'users', userId, 'tasks', taskId));
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};

// ============= TIMER SESSIONS =============
export const getTimerSessionsFromFirebase = async (userId: string): Promise<TimerSession[]> => {
  try {
    const sessionsSnapshot = await getDocs(getUserCollection(userId, 'sessions'));
    return sessionsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        startTime: timestampToISO(data.startTime),
        endTime: data.endTime ? timestampToISO(data.endTime) : undefined,
      } as TimerSession;
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return [];
  }
};

export const saveTimerSessionToFirebase = async (userId: string, session: TimerSession): Promise<void> => {
  try {
    const sessionRef = doc(db, 'users', userId, 'sessions', session.id);
    await setDoc(sessionRef, {
      ...session,
      startTime: Timestamp.fromDate(new Date(session.startTime)),
      endTime: session.endTime ? Timestamp.fromDate(new Date(session.endTime)) : null,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error saving session:', error);
    throw error;
  }
};

// ============= HABIT LOGS =============
export const getHabitLogsFromFirebase = async (userId: string): Promise<HabitLog[]> => {
  try {
    const logsSnapshot = await getDocs(getUserCollection(userId, 'habitLogs'));
    return logsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        habitId: data.habitId,
        date: data.date,
        completed: data.completed,
      } as HabitLog;
    });
  } catch (error) {
    console.error('Error fetching habit logs:', error);
    return [];
  }
};

export const saveHabitLogToFirebase = async (userId: string, log: HabitLog): Promise<void> => {
  try {
    const logId = `${log.habitId}-${log.date}`;
    const logRef = doc(db, 'users', userId, 'habitLogs', logId);
    await setDoc(logRef, {
      ...log,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error saving habit log:', error);
    throw error;
  }
};

// ============= MILESTONES =============
export const getMilestonesFromFirebase = async (userId: string): Promise<Milestone[]> => {
  try {
    const milestonesSnapshot = await getDocs(getUserCollection(userId, 'milestones'));
    return milestonesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        dueDate: data.dueDate || '',
      } as Milestone;
    });
  } catch (error) {
    console.error('Error fetching milestones:', error);
    return [];
  }
};

export const saveMilestoneToFirebase = async (userId: string, milestone: Milestone): Promise<void> => {
  try {
    const milestoneRef = doc(db, 'users', userId, 'milestones', milestone.id);
    await setDoc(milestoneRef, {
      ...milestone,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error saving milestone:', error);
    throw error;
  }
};

export const deleteMilestoneFromFirebase = async (userId: string, milestoneId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'users', userId, 'milestones', milestoneId));
  } catch (error) {
    console.error('Error deleting milestone:', error);
    throw error;
  }
};

// ============= BATCH SAVE (for syncing) =============
export const saveAllDataToFirebase = async (
  userId: string,
  data: {
    goals: Goal[];
    habits: Habit[];
    tasks: Task[];
    sessions: TimerSession[];
    habitLogs: HabitLog[];
    milestones: Milestone[];
  }
): Promise<void> => {
  try {
    const promises: Promise<void>[] = [];

    data.goals.forEach(goal => promises.push(saveGoalToFirebase(userId, goal)));
    data.habits.forEach(habit => promises.push(saveHabitToFirebase(userId, habit)));
    data.tasks.forEach(task => promises.push(saveTaskToFirebase(userId, task)));
    data.sessions.forEach(session => promises.push(saveTimerSessionToFirebase(userId, session)));
    data.habitLogs.forEach(log => promises.push(saveHabitLogToFirebase(userId, log)));
    data.milestones.forEach(milestone => promises.push(saveMilestoneToFirebase(userId, milestone)));

    await Promise.all(promises);
  } catch (error) {
    console.error('Error saving all data:', error);
    throw error;
  }
};
