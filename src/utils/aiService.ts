// AI Service for generating smart suggestions
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Goal, Habit, Task, TimerSession } from '../types';
import { SYSTEM_PROMPT, buildPrompt } from './aiPrompt';

export interface AISuggestion {
  id: string;
  type: 'goal' | 'habit' | 'task' | 'insight';
  title: string;
  description: string;
  reasoning: string;
  priority: 'low' | 'medium' | 'high';
  category?: string;
  dueDate?: string;
  createdAt: string;
}

export interface AIAnalysis {
  focusPatterns: string[];
  habitTrends: string[];
  goalProgress: string[];
  recommendations: AISuggestion[];
}

// Get or set API key from localStorage
export const getAIApiKey = (): string | null => {
  return localStorage.getItem('ai_api_key');
};

export const setAIApiKey = (key: string): void => {
  localStorage.setItem('ai_api_key', key);
};

export const hasAIApiKey = (): boolean => {
  return !!getAIApiKey();
};

// Analyze user data and generate insights
export const analyzeUserData = (
  goals: Goal[],
  habits: Habit[],
  _tasks: Task[],
  sessions: TimerSession[]
): AIAnalysis => {
  const focusPatterns = analyzeFocusPatterns(sessions);
  const habitTrends = analyzeHabitTrends(habits);
  const goalProgress = analyzeGoalProgress(goals);
  
  return {
    focusPatterns,
    habitTrends,
    goalProgress,
    recommendations: [],
  };
};

// Generate AI suggestions using Google Gemini API
export const generateAISuggestions = async (
  goals: Goal[],
  habits: Habit[],
  tasks: Task[],
  sessions: TimerSession[]
): Promise<AISuggestion[]> => {
  const apiKey = getAIApiKey();
  
  if (!apiKey) {
    throw new Error('AI API key not configured');
  }

  const analysis = analyzeUserData(goals, habits, tasks, sessions);
  const prompt = buildPrompt(goals, habits, tasks, sessions, analysis);

  const fullPrompt = `${SYSTEM_PROMPT}\n\n${prompt}`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{ text: fullPrompt }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1500,
      }
    });

    const response = result.response;
    const content = response.text();

    if (!content) {
      throw new Error('No response from AI');
    }

    return parseAISuggestions(content);
  } catch (error: any) {
    console.error('AI suggestion error:', error);
    
    // Handle specific error types
    if (error?.message?.includes('quota') || error?.message?.includes('429')) {
      throw new Error('RATE_LIMIT: Gemini API rate limit exceeded. Please wait a moment and try again, or use basic suggestions.');
    }
    if (error?.message?.includes('API_KEY_INVALID') || error?.message?.includes('invalid') || error?.status === 400) {
      throw new Error('INVALID_KEY: Invalid API key. Please check your AI settings.');
    }
    
    throw error;
  }
};

// Parse AI response into structured suggestions
const parseAISuggestions = (content: string): AISuggestion[] => {
  try {
    // Extract JSON from response (might be wrapped in markdown code blocks)
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const suggestions = JSON.parse(jsonMatch[0]);
    
    return suggestions.map((s: any, index: number) => ({
      id: `ai-suggestion-${Date.now()}-${index}`,
      type: s.type,
      title: s.title,
      description: s.description,
      reasoning: s.reasoning,
      priority: s.priority,
      createdAt: new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Failed to parse AI suggestions:', error);
    return [];
  }
};

// Analyze focus session patterns
const analyzeFocusPatterns = (sessions: TimerSession[]): string[] => {
  const patterns: string[] = [];
  const workSessions = sessions.filter(s => s.completed && s.type === 'work');

  if (workSessions.length === 0) {
    patterns.push('- No focus sessions recorded yet');
    return patterns;
  }

  // Calculate average session length
  const avgDuration = workSessions.reduce((sum, s) => sum + s.duration, 0) / workSessions.length;
  patterns.push(`- Average focus session: ${Math.round(avgDuration)} minutes`);

  // Sessions per day (last 7 days)
  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 7);
  const recentSessions = workSessions.filter(s => new Date(s.startTime) >= last7Days);
  patterns.push(`- ${recentSessions.length} focus sessions in last 7 days`);

  // Most productive day
  const sessionsByDay: { [key: string]: number } = {};
  workSessions.forEach(s => {
    const day = new Date(s.startTime).toLocaleDateString('en-US', { weekday: 'long' });
    sessionsByDay[day] = (sessionsByDay[day] || 0) + 1;
  });
  const mostProductiveDay = Object.entries(sessionsByDay).sort((a, b) => b[1] - a[1])[0];
  if (mostProductiveDay) {
    patterns.push(`- Most sessions on ${mostProductiveDay[0]} (${mostProductiveDay[1]} sessions)`);
  }

  return patterns;
};

// Analyze habit completion trends
const analyzeHabitTrends = (habits: Habit[]): string[] => {
  const trends: string[] = [];

  if (habits.length === 0) {
    trends.push('- No habits created yet');
    return trends;
  }

  trends.push(`- Tracking ${habits.length} habit${habits.length === 1 ? '' : 's'}`);

  const dailyHabits = habits.filter(h => h.frequency === 'daily').length;
  const weeklyHabits = habits.filter(h => h.frequency === 'weekly').length;

  if (dailyHabits > 0) {
    trends.push(`- ${dailyHabits} daily habit${dailyHabits === 1 ? '' : 's'}`);
  }
  if (weeklyHabits > 0) {
    trends.push(`- ${weeklyHabits} weekly habit${weeklyHabits === 1 ? '' : 's'}`);
  }

  return trends;
};

// Analyze goal progress and completion
const analyzeGoalProgress = (goals: Goal[]): string[] => {
  const progress: string[] = [];

  if (goals.length === 0) {
    progress.push('- No goals set yet');
    return progress;
  }

  const activeGoals = goals.filter(g => g.status !== 'completed');
  const completedGoals = goals.filter(g => g.status === 'completed');

  progress.push(`- ${activeGoals.length} active goal${activeGoals.length === 1 ? '' : 's'}, ${completedGoals.length} completed`);

  // Goals by progress level
  const notStarted = activeGoals.filter(g => g.progress === 0).length;
  const inProgress = activeGoals.filter(g => g.progress > 0 && g.progress < 100).length;

  if (notStarted > 0) {
    progress.push(`- ${notStarted} goal${notStarted === 1 ? '' : 's'} not yet started`);
  }
  if (inProgress > 0) {
    progress.push(`- ${inProgress} goal${inProgress === 1 ? '' : 's'} in progress`);
  }

  return progress;
};

// Generate fallback suggestions without AI
export const generateFallbackSuggestions = (
  goals: Goal[],
  habits: Habit[],
  tasks: Task[],
  sessions: TimerSession[]
): AISuggestion[] => {
  const suggestions: AISuggestion[] = [];

  // Suggest breaking down goals into tasks
  const goalsWithoutTasks = goals.filter(g => g.status !== 'completed' && g.progress === 0);
  if (goalsWithoutTasks.length > 0) {
    suggestions.push({
      id: `fallback-${Date.now()}-1`,
      type: 'task',
      title: `Break down "${goalsWithoutTasks[0].title}" into tasks`,
      description: 'Create 3-5 specific tasks that will move this goal forward this week.',
      reasoning: 'Goals without action items rarely get completed. Breaking them down makes progress measurable.',
      priority: 'high',
      createdAt: new Date().toISOString(),
    });
  }

  // Suggest daily habit if none exist
  if (habits.filter(h => h.frequency === 'daily').length === 0) {
    suggestions.push({
      id: `fallback-${Date.now()}-2`,
      type: 'habit',
      title: 'Add a daily morning routine',
      description: 'Start with a simple 5-minute morning habit like journaling, stretching, or planning your day.',
      reasoning: 'Daily habits create consistency and compound over time. Morning routines set the tone for productive days.',
      priority: 'medium',
      createdAt: new Date().toISOString(),
    });
  }

  // Suggest focus session if few completed
  if (sessions.filter(s => s.completed).length < 5) {
    suggestions.push({
      id: `fallback-${Date.now()}-3`,
      type: 'insight',
      title: 'Build a focus session routine',
      description: 'Try completing 2-3 focus sessions per day. Use 25-minute Pomodoros for deep work on your highest priority task.',
      reasoning: 'Consistent focus sessions improve concentration and help you make measurable progress on important work.',
      priority: 'high',
      createdAt: new Date().toISOString(),
    });
  }

  // Suggest completing high priority tasks
  const highPriorityPending = tasks.filter(t => !t.completed && t.priority === 'high');
  if (highPriorityPending.length > 0) {
    suggestions.push({
      id: `fallback-${Date.now()}-4`,
      type: 'insight',
      title: `Focus on ${highPriorityPending.length} high-priority task${highPriorityPending.length === 1 ? '' : 's'}`,
      description: `Schedule focus sessions for: ${highPriorityPending.slice(0, 3).map(t => t.title).join(', ')}`,
      reasoning: 'High-priority tasks should be completed first. Block dedicated time to tackle them.',
      priority: 'high',
      createdAt: new Date().toISOString(),
    });
  }

  return suggestions;
};
