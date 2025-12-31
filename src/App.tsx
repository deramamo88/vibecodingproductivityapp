import { useState, useEffect } from 'react';
import { Timer, ListTodo, Calendar, Target, LogOut, Clock } from 'lucide-react';
import { isToday } from 'date-fns';
import Auth from './components/Auth/Auth';
import FocusComponent from './components/Focus/Focus';
import TodoList from './components/TodoList/TodoList';
import HabitTracker from './components/HabitTracker/HabitTracker';
import Goals from './components/Goals/Goals';
import { getTimerSessions } from './utils/storage';
import './App.css';

type Tab = 'focus' | 'todos' | 'habits' | 'goals';

interface User {
  email: string;
  name: string;
}

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('focus');
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [todayFocusTime, setTodayFocusTime] = useState({ hours: 0, minutes: 0 });

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
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

    calculateTodayFocus();
    
    // Update every minute
    const interval = setInterval(calculateTodayFocus, 60000);
    
    // Listen for storage changes to update in real-time
    window.addEventListener('storage', calculateTodayFocus);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', calculateTodayFocus);
    };
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setActiveTab('focus');
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
          <span className="welcome-text">Welcome, {user.name}</span>
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            <LogOut size={18} />
          </button>
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
        {activeTab === 'todos' && <TodoList />}
        {activeTab === 'habits' && <HabitTracker />}
        {activeTab === 'goals' && <Goals />}
      </main>

      <footer className="app-footer">
        <p>Built with React + TypeScript + Vite • All data stored locally</p>
      </footer>
    </div>
  );
}

export default App;
