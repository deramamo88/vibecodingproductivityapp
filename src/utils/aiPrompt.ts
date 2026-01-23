import { Goal, Habit, Task, TimerSession } from '../types';
import { AIAnalysis } from './aiService';

export const SYSTEM_PROMPT = 'You are a productivity coach analyzing user data to provide personalized suggestions for goals, habits, and tasks. Provide actionable, specific recommendations that help users build better routines and achieve their goals.';

export const buildPrompt = (
  goals: Goal[],
  habits: Habit[],
  tasks: Task[],
  sessions: TimerSession[],
  analysis: AIAnalysis
): string => {
  const activeGoals = goals.filter(g => g.status !== 'completed');
  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;
  const totalFocusMinutes = sessions
    .filter(s => s.completed && s.type === 'work')
    .reduce((sum, s) => sum + s.duration, 0);

  return `Analyze this productivity data and provide 5-7 personalized suggestions:

**Current Goals (${activeGoals.length}):**
${activeGoals.map(g => `- ${g.title} (${g.status}, ${g.progress}% complete, target: ${g.targetDate || 'no date'})`).join('\n') || '- No active goals'}

**Habits (${habits.length}):**
${habits.map(h => `- ${h.name} (${h.frequency})`).join('\n') || '- No habits tracked'}

**Tasks:**
- Total: ${totalTasks}, Completed: ${completedTasks} (${totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%)
- Pending high priority: ${tasks.filter(t => !t.completed && t.priority === 'high').length}

**Focus Sessions:**
- Total focus time: ${Math.round(totalFocusMinutes / 60)} hours
- Sessions completed: ${sessions.filter(s => s.completed).length}

**Patterns Identified:**
${analysis.focusPatterns.join('\n')}
${analysis.habitTrends.join('\n')}
${analysis.goalProgress.join('\n')}

Provide suggestions in this JSON format:
[
  {
    "type": "goal" | "habit" | "task" | "insight",
    "title": "Brief title",
    "description": "Detailed actionable description",
    "reasoning": "Why this suggestion based on their data",
    "priority": "low" | "medium" | "high",
    "category": "Category name (for goals only)",
    "dueDate": "YYYY-MM-DD format (for goals only, realistic timeframe)"
  }
]

**Important Guidelines:**
- When suggesting GOALS (type: "goal"), the "title" should be the goal name itself (e.g., "Complete Full Stack Developer Course", "Run a 5K Marathon", "Save $10,000 Emergency Fund")
- For each GOAL, include a "category" field with one of: Career, Health & Fitness, Personal Development, Financial, Relationships, Hobbies, Education, or create a relevant category
- For each GOAL, include a "dueDate" in YYYY-MM-DD format, set 3-12 months in the future depending on goal complexity (use today's date as reference: ${new Date().toISOString().split('T')[0]})
- Suggest goals across different life categories: Career, Health & Fitness, Personal Development, Financial, Relationships, Hobbies, etc.
- If user has no goals, suggest 3-4 diverse, ambitious but achievable goals in different categories
- For habits and tasks, keep titles concise and actionable

Focus on:
1. Breaking down large goals into smaller tasks
2. Suggesting habits that support active goals
3. Identifying tasks that align with goals
4. Suggesting new goals in different life areas if user has few/no goals
5. Optimizing focus session timing based on patterns
6. Recommending realistic next steps
7. Highlighting connections between goals, habits, and tasks`;
};
