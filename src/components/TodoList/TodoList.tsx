import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { getTasks, saveTasks, generateId } from '../../utils/storage';
import { Task, Goal, Habit, TimerSession } from '../../types';
import { AISuggestion } from '../../utils/aiService';
import InlineAISuggestions from '../InlineAISuggestions/InlineAISuggestions';
import './TodoList.css';

interface TodoListProps {
  aiSuggestionHandler?: {
    goals: Goal[];
    habits: Habit[];
    tasks: Task[];
    sessions: TimerSession[];
    onAddTask: (suggestion: AISuggestion) => void;
    onOpenSettings: () => void;
  };
}

export default function TodoList({ aiSuggestionHandler }: TodoListProps) {
  const [tasks, setTasks] = useState<Task[]>(getTasks());
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const handleAddTask = (task: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...task,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    saveTasks(updatedTasks);
    setShowForm(false);
  };

  const handleUpdateTask = (updatedTask: Task) => {
    const updatedTasks = tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t));
    setTasks(updatedTasks);
    saveTasks(updatedTasks);
    setEditingTask(null);
  };

  const handleDeleteTask = (id: string) => {
    const updatedTasks = tasks.filter((t) => t.id !== id);
    setTasks(updatedTasks);
    saveTasks(updatedTasks);
  };

  const handleToggleComplete = (id: string) => {
    const updatedTasks = tasks.map((t) =>
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    setTasks(updatedTasks);
    saveTasks(updatedTasks);
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'active') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return (
    <div className="todo-container">
      <div className="todo-header">
        <h1>To-Do List</h1>
        <div className="header-actions">
          {aiSuggestionHandler && (
            <InlineAISuggestions
              type="task"
              goals={aiSuggestionHandler.goals}
              habits={aiSuggestionHandler.habits}
              tasks={aiSuggestionHandler.tasks}
              sessions={aiSuggestionHandler.sessions}
              onAdd={aiSuggestionHandler.onAddTask}
              onOpenSettings={aiSuggestionHandler.onOpenSettings}
            />
          )}
          <button className="add-btn primary" onClick={() => setShowForm(true)}>
            <Plus size={20} /> Add Task
          </button>
        </div>
      </div>

      <div className="filter-tabs">
        <button
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          All ({tasks.length})
        </button>
        <button
          className={filter === 'active' ? 'active' : ''}
          onClick={() => setFilter('active')}
        >
          Active ({tasks.filter((t) => !t.completed).length})
        </button>
        <button
          className={filter === 'completed' ? 'active' : ''}
          onClick={() => setFilter('completed')}
        >
          Completed ({tasks.filter((t) => t.completed).length})
        </button>
      </div>

      {showForm && (
        <TaskForm
          onSave={handleAddTask}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="task-list">
        {sortedTasks.length === 0 ? (
          <div className="empty-state">
            <p>No tasks yet. Add one to get started!</p>
          </div>
        ) : (
          sortedTasks.map((task) =>
            editingTask?.id === task.id ? (
              <TaskForm
                key={task.id}
                task={editingTask}
                onSave={handleUpdateTask}
                onCancel={() => setEditingTask(null)}
              />
            ) : (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={handleToggleComplete}
                onEdit={setEditingTask}
                onDelete={handleDeleteTask}
              />
            )
          )
        )}
      </div>
    </div>
  );
}

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

function TaskItem({ task, onToggle, onEdit, onDelete }: TaskItemProps) {
  return (
    <div className={`task-item card priority-${task.priority} ${task.completed ? 'completed' : ''}`}>
      <div className="task-content">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => onToggle(task.id)}
          className="task-checkbox"
        />
        <div className="task-details">
          <h3 className="task-title">{task.title}</h3>
          {task.description && <p className="task-description">{task.description}</p>}
          <div className="task-meta">
            <span className={`priority-badge priority-${task.priority}`}>
              {task.priority}
            </span>
            {task.category && <span className="category-badge">{task.category}</span>}
            {task.dueDate && (
              <span className="due-date">Due: {new Date(task.dueDate).toLocaleDateString()}</span>
            )}
          </div>
        </div>
      </div>
      <div className="task-actions">
        <button onClick={() => onEdit(task)} title="Edit">
          <Edit2 size={18} />
        </button>
        <button onClick={() => onDelete(task.id)} title="Delete" className="delete-btn">
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}

interface TaskFormProps {
  task?: Task;
  onSave: (task: Task) => void;
  onCancel: () => void;
}

function TaskForm({ task, onSave, onCancel }: TaskFormProps) {
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'medium' as const,
    category: task?.category || '',
    dueDate: task?.dueDate || '',
    completed: task?.completed || false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    if (task) {
      onSave({ ...task, ...formData });
    } else {
      // Creating new task - parent component handles id, createdAt
      onSave(formData as any);
    }
  };

  return (
    <form className="task-form card" onSubmit={handleSubmit}>
      <h3>{task ? 'Edit Task' : 'New Task'}</h3>
      <div className="form-group">
        <input
          type="text"
          placeholder="Task title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
          autoFocus
        />
      </div>
      <div className="form-group">
        <textarea
          placeholder="Description (optional)"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Priority</label>
          <select
            value={formData.priority}
            onChange={(e) =>
              setFormData({ ...formData, priority: e.target.value as Task['priority'] })
            }
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div className="form-group">
          <label>Category</label>
          <input
            type="text"
            placeholder="e.g., Work, Personal"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Due Date</label>
          <input
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
          />
        </div>
      </div>
      <div className="form-actions">
        <button type="submit" className="primary">
          <Check size={18} /> Save
        </button>
        <button type="button" onClick={onCancel}>
          <X size={18} /> Cancel
        </button>
      </div>
    </form>
  );
}
