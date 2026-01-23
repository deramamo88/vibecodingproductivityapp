import { useState, useEffect } from 'react';
import { Timer, ListTodo, Calendar, Target, LogOut, Clock, ChevronDown, Settings } from 'lucide-react';
import { isToday } from 'date-fns';
import { signInAnonymously } from 'firebase/auth';
import { auth } from './config/firebase';
import Auth from './components/Auth/Auth';
import FocusComponent from './components/Focus/Focus';
import TodoList from './components/TodoList/TodoList';
import HabitTracker from './components/HabitTracker/HabitTracker';
import Goals from './components/Goals/Goals';
import AISettings from './components/AISettings/AISettings';
import { getTimerSessions, getGoals, getHabits, getTasks, saveGoals, saveHabits, saveTasks, generateId, setCurrentUserId, loadDataFromFirebase } from './utils/storage';
import { AISuggestion } from './utils/aiService';
import './App.css';

type Tab = 'focus' | 'todos' | 'habits' | 'goals';

interface User {
  email: string;
  name: string;
  picture?: string;
}

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('focus');
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [todayFocusTime, setTodayFocusTime] = useState({ hours: 0, minutes: 0 });
  const [showAISettings, setShowAISettings] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        // Set user ID for Firebase storage and load data
        setCurrentUserId(parsedUser.email);
        loadDataFromFirebase(parsedUser.email).then(() => {
          setIsLoading(false);
        });
        return;
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Calculate today's focus time
    const calculateTodayFocus = () => {
      const sessions = getTimerSessions();
      const todaySessions = sessions.filter(
        (s) => s.completed && s.type === 'work' && isToday(new Date(s.startTime))
      );
      const totalSeconds = todaySessions.reduce((acc, s) => acc + s.duration, 0);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      setTodayFocusTime({ hours, minutes });
    };

    if (user) {
      calculateTodayFocus();
      
      // Update every minute
      const interval = setInterval(calculateTodayFocus, 60000);
      
      return () => {
        clearInterval(interval);
      };
    }
  }, [user]);

  const handleLogin = async (userData: User) => {
    setUser(userData);
    
    // Sign in to Firebase anonymously to get auth context
    try {
      console.log('🔐 Signing into Firebase Auth...');
      await signInAnonymously(auth);
      console.log('✅ Firebase Auth successful');
    } catch (error) {
      console.error('❌ Firebase Auth error:', error);
    }
    
    // Set user ID for Firebase storage and load data
    setCurrentUserId(userData.email);
    await loadDataFromFirebase(userData.email);
    setRefreshKey(prev => prev + 1); // Refresh components with new data
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setCurrentUserId(null);
    setActiveTab('focus');
  };

  // AI Suggestion handlers
  const handleAddGoalFromSuggestion = async (suggestion: AISuggestion) => {
    const goals = await getGoals();
    const newGoal = {
      id: generateId(),
      title: suggestion.title,
      description: suggestion.description,
      category: suggestion.category || '',
      targetDate: suggestion.dueDate || '',
      status: 'active' as const,
      progress: 0,
      createdAt: new Date().toISOString(),
    };
    await saveGoals([...goals, newGoal]);
    setRefreshKey(prev => prev + 1);
    setActiveTab('goals');
  };

  const handleAddHabitFromSuggestion = async (suggestion: AISuggestion) => {
    const habits = await getHabits();
    const newHabit = {
      id: generateId(),
      name: suggestion.title,
      description: suggestion.description,
      frequency: 'daily' as const,
      color: '#3b82f6',
      createdAt: new Date().toISOString(),
    };
    await saveHabits([...habits, newHabit]);
    setRefreshKey(prev => prev + 1);
    setActiveTab('habits');
  };

  const handleAddTaskFromSuggestion = async (suggestion: AISuggestion) => {
    const tasks = await getTasks();
    const newTask = {
      id: generateId(),
      title: suggestion.title,
      description: suggestion.description,
      priority: suggestion.priority as 'low' | 'medium' | 'high',
      category: '',
      dueDate: '',
      completed: false,
      createdAt: new Date().toISOString(),
    };
    await saveTasks([...tasks, newTask]);
    setRefreshKey(prev => prev + 1);
    setActiveTab('todos');
  };

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-left">
          <Clock size={18} />
          <span className="focus-time">
            {todayFocusTime.hours > 0 && `${todayFocusTime.hours}h `}
            {todayFocusTime.minutes}m today
          </span>
        </div>
        <div className="user-section">
          <button 
            className="user-menu-btn" 
            onClick={() => setShowUserMenu(!showUserMenu)}
            title="User Menu"
          >
            <span className="welcome-text">Welcome, {user.name}</span>
            <ChevronDown size={16} />
          </button>
          {showUserMenu && (
            <div className="user-menu-dropdown">
              <button onClick={() => { setShowAISettings(true); setShowUserMenu(false); }}>
                <Settings size={16} />
                AI Settings
              </button>
              <button onClick={handleLogout}>
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      <nav className="nav-tabs">
        <button
          className={`nav-tab ${activeTab === 'focus' ? 'active' : ''}`}
          onClick={() => setActiveTab('focus')}
        >
          <Timer size={20} />
          <span>Focus</span>
        </button>
        <button
          className={`nav-tab ${activeTab === 'todos' ? 'active' : ''}`}
          onClick={() => setActiveTab('todos')}
        >
          <ListTodo size={20} />
          <span>To-Do</span>
        </button>
        <button
          className={`nav-tab ${activeTab === 'habits' ? 'active' : ''}`}
          onClick={() => setActiveTab('habits')}
        >
          <Calendar size={20} />
          <span>Habits</span>
        </button>
        <button
          className={`nav-tab ${activeTab === 'goals' ? 'active' : ''}`}
          onClick={() => setActiveTab('goals')}
        >
          <Target size={20} />
          <span>Goals</span>
        </button>
      </nav>

      <main className="app-content">
        {activeTab === 'focus' && <FocusComponent />}
        {activeTab === 'todos' && (
          <TodoList
            key={`todos-${refreshKey}`}
            aiSuggestionHandler={{
              goals: getGoals(),
              habits: getHabits(),
              tasks: getTasks(),
              sessions: getTimerSessions(),
              onAddTask: handleAddTaskFromSuggestion,
              onOpenSettings: () => setShowAISettings(true),
            }}
          />
        )}
        {activeTab === 'habits' && (
          <HabitTracker
            key={`habits-${refreshKey}`}
            aiSuggestionHandler={{
              goals: getGoals(),
              habits: getHabits(),
              tasks: getTasks(),
              sessions: getTimerSessions(),
              onAddHabit: handleAddHabitFromSuggestion,
              onOpenSettings: () => setShowAISettings(true),
            }}
          />
        )}
        {activeTab === 'goals' && (
          <Goals
            key={`goals-${refreshKey}`}
            aiSuggestionHandler={{
              goals: getGoals(),
              habits: getHabits(),
              tasks: getTasks(),
              sessions: getTimerSessions(),
              onAddGoal: handleAddGoalFromSuggestion,
              onOpenSettings: () => setShowAISettings(true),
            }}
          />
        )}
      </main>

      {showAISettings && (
        <AISettings onClose={() => setShowAISettings(false)} />
      )}

      <footer className="app-footer">
        <p>Built with React + TypeScript + Vite • All data stored locally</p>
      </footer>
    </div>
  );
}

export default App;
