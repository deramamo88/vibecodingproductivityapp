import { useState } from 'react';
import { Plus, Trash2, Edit2, Target, CheckCircle, Circle } from 'lucide-react';
import { format } from 'date-fns';
import {
  getGoals,
  saveGoals,
  getMilestones,
  saveMilestones,
  generateId,
} from '../../utils/storage';
import { Goal, Milestone, Habit, Task, TimerSession } from '../../types';
import { AISuggestion } from '../../utils/aiService';
import InlineAISuggestions from '../InlineAISuggestions/InlineAISuggestions';
import './Goals.css';

interface GoalsProps {
  aiSuggestionHandler?: {
    goals: Goal[];
    habits: Habit[];
    tasks: Task[];
    sessions: TimerSession[];
    onAddGoal: (suggestion: AISuggestion) => void;
    onOpenSettings: () => void;
  };
}

export default function Goals({ aiSuggestionHandler }: GoalsProps) {
  const [goals, setGoals] = useState<Goal[]>(getGoals());
  const [milestones, setMilestones] = useState<Milestone[]>(getMilestones());
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');

  const handleAddGoal = (goal: Omit<Goal, 'id' | 'createdAt' | 'status' | 'progress'>) => {
    const newGoal: Goal = {
      ...goal,
      id: generateId(),
      createdAt: new Date().toISOString(),
      status: 'active',
      progress: 0,
    };
    const updatedGoals = [...goals, newGoal];
    setGoals(updatedGoals);
    saveGoals(updatedGoals);
    setShowGoalForm(false);
  };

  const handleUpdateGoal = (updatedGoal: Goal) => {
    const updatedGoals = goals.map((g) => (g.id === updatedGoal.id ? updatedGoal : g));
    setGoals(updatedGoals);
    saveGoals(updatedGoals);
    setEditingGoal(null);
  };

  const handleDeleteGoal = (id: string) => {
    const updatedGoals = goals.filter((g) => g.id !== id);
    const updatedMilestones = milestones.filter((m) => m.goalId !== id);
    setGoals(updatedGoals);
    saveMilestones(updatedMilestones);
    setMilestones(updatedMilestones);
    saveGoals(updatedGoals);
    if (selectedGoal?.id === id) {
      setSelectedGoal(null);
    }
  };

  const handleAddMilestone = (goalId: string, title: string, dueDate?: string) => {
    const newMilestone: Milestone = {
      id: generateId(),
      goalId,
      title,
      completed: false,
      dueDate,
    };
    const updatedMilestones = [...milestones, newMilestone];
    setMilestones(updatedMilestones);
    saveMilestones(updatedMilestones);
    updateGoalProgress(goalId, updatedMilestones);
  };

  const handleToggleMilestone = (milestoneId: string) => {
    const milestone = milestones.find((m) => m.id === milestoneId);
    if (!milestone) return;

    const updatedMilestones = milestones.map((m) =>
      m.id === milestoneId ? { ...m, completed: !m.completed } : m
    );
    setMilestones(updatedMilestones);
    saveMilestones(updatedMilestones);
    updateGoalProgress(milestone.goalId, updatedMilestones);
  };

  const handleDeleteMilestone = (milestoneId: string) => {
    const milestone = milestones.find((m) => m.id === milestoneId);
    if (!milestone) return;

    const updatedMilestones = milestones.filter((m) => m.id !== milestoneId);
    setMilestones(updatedMilestones);
    saveMilestones(updatedMilestones);
    updateGoalProgress(milestone.goalId, updatedMilestones);
  };

  const updateGoalProgress = (goalId: string, updatedMilestones: Milestone[]) => {
    const goalMilestones = updatedMilestones.filter((m) => m.goalId === goalId);
    const progress =
      goalMilestones.length > 0
        ? Math.round(
            (goalMilestones.filter((m) => m.completed).length / goalMilestones.length) * 100
          )
        : 0;

    const updatedGoals = goals.map((g) =>
      g.id === goalId ? { ...g, progress } : g
    );
    setGoals(updatedGoals);
    saveGoals(updatedGoals);
  };

  const filteredGoals = goals.filter((goal) => {
    if (filter === 'active') return goal.status === 'active';
    if (filter === 'completed') return goal.status === 'completed';
    return true;
  });

  const getGoalMilestones = (goalId: string) =>
    milestones.filter((m) => m.goalId === goalId);

  return (
    <div className="goals-container">
      <div className="goals-header">
        <h1>Goals</h1>
        <div className="header-actions">
          {aiSuggestionHandler && (
            <InlineAISuggestions
              type="goal"
              goals={aiSuggestionHandler.goals}
              habits={aiSuggestionHandler.habits}
              tasks={aiSuggestionHandler.tasks}
              sessions={aiSuggestionHandler.sessions}
              onAdd={aiSuggestionHandler.onAddGoal}
              onOpenSettings={aiSuggestionHandler.onOpenSettings}
            />
          )}
          <button className="add-btn primary" onClick={() => setShowGoalForm(true)}>
            <Plus size={20} /> Add Goal
          </button>
        </div>
      </div>

      <div className="filter-tabs">
        <button
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          All ({goals.length})
        </button>
        <button
          className={filter === 'active' ? 'active' : ''}
          onClick={() => setFilter('active')}
        >
          Active ({goals.filter((g) => g.status === 'active').length})
        </button>
        <button
          className={filter === 'completed' ? 'active' : ''}
          onClick={() => setFilter('completed')}
        >
          Completed ({goals.filter((g) => g.status === 'completed').length})
        </button>
      </div>

      {showGoalForm && (
        <GoalForm onSave={handleAddGoal} onCancel={() => setShowGoalForm(false)} />
      )}

      <div className="goals-layout">
        <div className="goals-list">
          {filteredGoals.length === 0 ? (
            <div className="empty-state card">
              <Target size={48} />
              <p>No goals yet. Set a goal and start making progress!</p>
            </div>
          ) : (
            filteredGoals.map((goal) =>
              editingGoal?.id === goal.id ? (
                <GoalForm
                  key={goal.id}
                  goal={editingGoal}
                  onSave={handleUpdateGoal}
                  onCancel={() => setEditingGoal(null)}
                />
              ) : (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  milestoneCount={getGoalMilestones(goal.id).length}
                  onSelect={setSelectedGoal}
                  onEdit={setEditingGoal}
                  onDelete={handleDeleteGoal}
                  isSelected={selectedGoal?.id === goal.id}
                />
              )
            )
          )}
        </div>

        {selectedGoal && (
          <div className="goal-details">
            <GoalDetails
              goal={selectedGoal}
              milestones={getGoalMilestones(selectedGoal.id)}
              onAddMilestone={handleAddMilestone}
              onToggleMilestone={handleToggleMilestone}
              onDeleteMilestone={handleDeleteMilestone}
              onClose={() => setSelectedGoal(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

interface GoalCardProps {
  goal: Goal;
  milestoneCount: number;
  onSelect: (goal: Goal) => void;
  onEdit: (goal: Goal) => void;
  onDelete: (id: string) => void;
  isSelected: boolean;
}

function GoalCard({
  goal,
  milestoneCount,
  onSelect,
  onEdit,
  onDelete,
  isSelected,
}: GoalCardProps) {
  return (
    <div
      className={`goal-card card ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(goal)}
    >
      <div className="goal-card-header">
        <div className="goal-info">
          <h3>{goal.title}</h3>
          <p className="goal-category">{goal.category}</p>
        </div>
        <div className="goal-actions" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => onEdit(goal)} title="Edit">
            <Edit2 size={16} />
          </button>
          <button onClick={() => onDelete(goal.id)} title="Delete" className="delete-btn">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="progress-section">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${goal.progress}%` }} />
        </div>
        <span className="progress-text">{goal.progress}% Complete</span>
      </div>

      <div className="goal-meta">
        <span>📍 {milestoneCount} milestones</span>
        {goal.targetDate && <span>📅 Due: {format(new Date(goal.targetDate), 'MMM d, yyyy')}</span>}
      </div>
    </div>
  );
}

interface GoalDetailsProps {
  goal: Goal;
  milestones: Milestone[];
  onAddMilestone: (goalId: string, title: string, dueDate?: string) => void;
  onToggleMilestone: (id: string) => void;
  onDeleteMilestone: (id: string) => void;
  onClose: () => void;
}

function GoalDetails({
  goal,
  milestones,
  onAddMilestone,
  onToggleMilestone,
  onDeleteMilestone,
  onClose,
}: GoalDetailsProps) {
  const [newMilestone, setNewMilestone] = useState('');
  const [milestoneDueDate, setMilestoneDueDate] = useState('');

  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestone.trim()) return;
    onAddMilestone(goal.id, newMilestone, milestoneDueDate || undefined);
    setNewMilestone('');
    setMilestoneDueDate('');
  };

  return (
    <div className="goal-details-panel card">
      <div className="details-header">
        <h2>{goal.title}</h2>
        <button onClick={onClose} className="close-btn">
          ×
        </button>
      </div>

      <div className="details-section">
        <h4>Description</h4>
        <p>{goal.description}</p>
      </div>

      <div className="details-section">
        <h4>Category</h4>
        <p>{goal.category}</p>
      </div>

      <div className="details-section">
        <h4>Target Date</h4>
        {goal.targetDate ? (
          <p>{format(new Date(goal.targetDate), 'MMMM d, yyyy')}</p>
        ) : (
          <p className="no-date">No target date set</p>
        )}
      </div>

      <div className="details-section">
        <h4>Progress</h4>
        <div className="progress-bar large">
          <div className="progress-fill" style={{ width: `${goal.progress}%` }} />
        </div>
        <p className="progress-text">{goal.progress}% Complete</p>
      </div>

      <div className="details-section">
        <h4>Milestones</h4>
        <form className="milestone-form" onSubmit={handleAddMilestone}>
          <input
            type="text"
            placeholder="Add a milestone..."
            value={newMilestone}
            onChange={(e) => setNewMilestone(e.target.value)}
          />
          <input
            type="date"
            value={milestoneDueDate}
            onChange={(e) => setMilestoneDueDate(e.target.value)}
          />
          <button type="submit" className="primary">
            <Plus size={16} />
          </button>
        </form>

        <div className="milestones-list">
          {milestones.length === 0 ? (
            <p className="empty-message">No milestones yet. Add one to track progress!</p>
          ) : (
            milestones.map((milestone) => (
              <div key={milestone.id} className="milestone-item">
                <button
                  className="milestone-checkbox"
                  onClick={() => onToggleMilestone(milestone.id)}
                >
                  {milestone.completed ? (
                    <CheckCircle size={20} color="#4ecdc4" />
                  ) : (
                    <Circle size={20} />
                  )}
                </button>
                <div className="milestone-content">
                  <span className={milestone.completed ? 'completed' : ''}>
                    {milestone.title}
                  </span>
                  {milestone.dueDate && (
                    <span className="milestone-date">
                      {format(new Date(milestone.dueDate), 'MMM d')}
                    </span>
                  )}
                </div>
                <button
                  className="delete-milestone-btn"
                  onClick={() => onDeleteMilestone(milestone.id)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

interface GoalFormProps {
  goal?: Goal;
  onSave: (goal: Goal) => void;
  onCancel: () => void;
}

function GoalForm({ goal, onSave, onCancel }: GoalFormProps) {
  const [formData, setFormData] = useState({
    title: goal?.title || '',
    description: goal?.description || '',
    category: goal?.category || '',
    targetDate: goal?.targetDate || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.targetDate) return;

    if (goal) {
      onSave({ ...goal, ...formData });
    } else {
      // Creating new goal - parent component handles id, createdAt, status, progress
      onSave(formData as any);
    }
  };

  return (
    <form className="goal-form card" onSubmit={handleSubmit}>
      <h3>{goal ? 'Edit Goal' : 'New Goal'}</h3>
      <div className="form-group">
        <label>Goal Title</label>
        <input
          type="text"
          placeholder="e.g., Learn a new language"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
          autoFocus
        />
      </div>
      <div className="form-group">
        <label>Description</label>
        <textarea
          placeholder="What do you want to achieve?"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          required
        />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Category</label>
          <input
            type="text"
            placeholder="e.g., Career, Health, Learning"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label>Target Date</label>
          <input
            type="date"
            value={formData.targetDate}
            onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
            required
          />
        </div>
      </div>
      <div className="form-actions">
        <button type="submit" className="primary">
          Save Goal
        </button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
