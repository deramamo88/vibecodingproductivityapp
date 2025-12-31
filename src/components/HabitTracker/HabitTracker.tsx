import { useState } from 'react';
import { Plus, Trash2, TrendingUp, Calendar } from 'lucide-react';
import { format, addDays, isToday, parseISO } from 'date-fns';
import {
  getHabits,
  saveHabits,
  getHabitLogs,
  saveHabitLogs,
  generateId,
} from '../../utils/storage';
import { Habit, HabitLog } from '../../types';
import './HabitTracker.css';

const HABIT_COLORS = [
  '#646cff', '#ff6b6b', '#4ecdc4', '#45b7d1', 
  '#f7b731', '#5f27cd', '#00d2d3', '#ee5a6f'
];

export default function HabitTracker() {
  const [habits, setHabits] = useState<Habit[]>(getHabits());
  const [logs, setLogs] = useState<HabitLog[]>(getHabitLogs());
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<'7days' | '30days'>('7days');

  const handleAddHabit = (habit: Omit<Habit, 'id' | 'createdAt'>) => {
    const newHabit: Habit = {
      ...habit,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    const updatedHabits = [...habits, newHabit];
    setHabits(updatedHabits);
    saveHabits(updatedHabits);
    setShowForm(false);
  };

  const handleDeleteHabit = (id: string) => {
    const updatedHabits = habits.filter((h) => h.id !== id);
    setHabits(updatedHabits);
    saveHabits(updatedHabits);
  };

  const handleToggleLog = (habitId: string, date: string) => {
    const existingLog = logs.find(
      (log) => log.habitId === habitId && log.date === date
    );

    let updatedLogs: HabitLog[];
    if (existingLog) {
      updatedLogs = logs.map((log) =>
        log.habitId === habitId && log.date === date
          ? { ...log, completed: !log.completed }
          : log
      );
    } else {
      updatedLogs = [...logs, { habitId, date, completed: true }];
    }

    setLogs(updatedLogs);
    saveHabitLogs(updatedLogs);
  };

  const getStreak = (habitId: string): number => {
    const habitLogs = logs
      .filter((log) => log.habitId === habitId && log.completed)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (habitLogs.length === 0) return 0;

    let streak = 0;
    const today = format(new Date(), 'yyyy-MM-dd');
    let currentDate = new Date(today);

    for (const log of habitLogs) {
      const logDate = format(parseISO(log.date), 'yyyy-MM-dd');
      const checkDate = format(currentDate, 'yyyy-MM-dd');

      if (logDate === checkDate) {
        streak++;
        currentDate = addDays(currentDate, -1);
      } else if (new Date(logDate) < new Date(checkDate)) {
        break;
      }
    }

    return streak;
  };

  const getCompletionRate = (habitId: string, days: number = 30): number => {
    const cutoffDate = addDays(new Date(), -days);
    const relevantLogs = logs.filter(
      (log) =>
        log.habitId === habitId &&
        log.completed &&
        new Date(log.date) >= cutoffDate
    );
    return Math.round((relevantLogs.length / days) * 100);
  };

  return (
    <div className="habits-container">
      <div className="habits-header">
        <h1>Habit Tracker</h1>
        <div className="header-actions">
          <div className="view-mode-toggle">
            <button
              className={`mode-btn ${viewMode === '7days' ? 'active' : ''}`}
              onClick={() => setViewMode('7days')}
            >
              7 Days
            </button>
            <button
              className={`mode-btn ${viewMode === '30days' ? 'active' : ''}`}
              onClick={() => setViewMode('30days')}
            >
              30 Days
            </button>
          </div>
          <button className="add-btn primary" onClick={() => setShowForm(true)}>
            <Plus size={20} /> Add Habit
          </button>
        </div>
      </div>

      {showForm && (
        <HabitForm onSave={handleAddHabit} onCancel={() => setShowForm(false)} />
      )}

      {habits.length === 0 ? (
        <div className="empty-state card">
          <Calendar size={48} />
          <p>No habits yet. Start building good habits today!</p>
        </div>
      ) : (
        <div className="habits-list">
          {habits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              logs={logs}
              streak={getStreak(habit.id)}
              completionRate={getCompletionRate(habit.id)}
              viewMode={viewMode}
              onToggleLog={handleToggleLog}
              onDelete={handleDeleteHabit}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface HabitCardProps {
  habit: Habit;
  logs: HabitLog[];
  streak: number;
  completionRate: number;
  viewMode: '7days' | '30days';
  onToggleLog: (habitId: string, date: string) => void;
  onDelete: (id: string) => void;
}

function HabitCard({
  habit,
  logs,
  streak,
  completionRate,
  viewMode,
  onToggleLog,
  onDelete,
}: HabitCardProps) {
  const daysToShow = viewMode === '7days' ? 7 : 30;
  const today = new Date();
  const days = Array.from({ length: daysToShow }, (_, i) => addDays(today, -daysToShow + i + 1));

  const isHabitCompleted = (date: Date): boolean => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const log = logs.find((log) => log.habitId === habit.id && log.date === dateStr);
    return log?.completed || false;
  };

  return (
    <div className="habit-card card" style={{ borderLeftColor: habit.color }}>
      <div className="habit-header">
        <div className="habit-info">
          <h3>{habit.name}</h3>
          {habit.description && <p className="habit-description">{habit.description}</p>}
          <div className="habit-stats">
            <span className="stat">
              <TrendingUp size={16} /> {streak} day streak
            </span>
            <span className="stat">{completionRate}% (30 days)</span>
            <span className="frequency-badge">{habit.frequency}</span>
          </div>
        </div>
        <button
          className="delete-btn"
          onClick={() => onDelete(habit.id)}
          title="Delete habit"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div className="week-tracker">
        <h4>{viewMode === '7days' ? 'Last 7 Days' : 'Last 30 Days'}</h4>
        <div className={`week-grid ${viewMode === '30days' ? 'grid-30' : ''}`}>
          {days.map((date) => {
            const completed = isHabitCompleted(date);
            const today = isToday(date);
            const dateStr = format(date, 'yyyy-MM-dd');

            return (
              <button
                key={dateStr}
                className={`day-cell ${completed ? 'completed' : ''} ${today ? 'today' : ''}`}
                onClick={() => onToggleLog(habit.id, dateStr)}
                style={{
                  backgroundColor: completed ? habit.color : undefined,
                }}
              >
                <div className="day-name">{format(date, 'EEE')}</div>
                <div className="day-number">{format(date, 'd')}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface HabitFormProps {
  onSave: (habit: Omit<Habit, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

function HabitForm({ onSave, onCancel }: HabitFormProps) {
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    frequency: 'daily' | 'weekly';
    color: string;
  }>({
    name: '',
    description: '',
    frequency: 'daily',
    color: HABIT_COLORS[0],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    onSave(formData);
  };

  return (
    <form className="habit-form card" onSubmit={handleSubmit}>
      <h3>New Habit</h3>
      <div className="form-group">
        <label>Habit Name</label>
        <input
          type="text"
          placeholder="e.g., Morning Exercise, Read 30 minutes"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          autoFocus
        />
      </div>
      <div className="form-group">
        <label>Description (optional)</label>
        <textarea
          placeholder="What does this habit involve?"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={2}
        />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Frequency</label>
          <select
            value={formData.frequency}
            onChange={(e) =>
              setFormData({ ...formData, frequency: e.target.value as Habit['frequency'] })
            }
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>
        <div className="form-group">
          <label>Color</label>
          <div className="color-picker">
            {HABIT_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={`color-option ${formData.color === color ? 'selected' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => setFormData({ ...formData, color })}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="form-actions">
        <button type="submit" className="primary">
          Save Habit
        </button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
