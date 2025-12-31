import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings, Clock, TrendingUp, Calendar, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { format, startOfDay, startOfWeek, isToday, isThisWeek, subDays, isSameDay } from 'date-fns';
import {
  getTimerSettings,
  saveTimerSettings,
  getTimerSessions,
  saveTimerSessions,
  generateId,
} from '../../utils/storage';
import { TimerSession, TimerSettings as TimerSettingsType } from '../../types';
import './Focus.css';

type TimerMode = 'work' | 'break' | 'longBreak';

export default function Focus() {
  const [settings, setSettings] = useState<TimerSettingsType>(getTimerSettings());
  const [mode, setMode] = useState<TimerMode>('work');
  const [timeLeft, setTimeLeft] = useState(settings.workDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [sessions, setSessions] = useState<TimerSession[]>(getTimerSessions());
  const intervalRef = useRef<number | null>(null);
  const sessionStartRef = useRef<string | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const handleTimerComplete = () => {
    setIsRunning(false);
    
    // Save session
    if (sessionStartRef.current) {
      const session: TimerSession = {
        id: generateId(),
        type: mode,
        duration: getCurrentDuration() * 60,
        startTime: sessionStartRef.current,
        endTime: new Date().toISOString(),
        completed: true,
      };
      const updatedSessions = [...sessions, session];
      setSessions(updatedSessions);
      saveTimerSessions(updatedSessions);
      sessionStartRef.current = null;
    }

    if (settings.soundEnabled) {
      playNotificationSound();
    }

    // Switch modes
    if (mode === 'work') {
      const newSessions = sessionsCompleted + 1;
      setSessionsCompleted(newSessions);
      
      if (newSessions % settings.sessionsBeforeLongBreak === 0) {
        setMode('longBreak');
        setTimeLeft(settings.longBreakDuration * 60);
      } else {
        setMode('break');
        setTimeLeft(settings.shortBreakDuration * 60);
      }
      
      if (settings.autoStartBreaks) {
        setIsRunning(true);
        sessionStartRef.current = new Date().toISOString();
      }
    } else {
      setMode('work');
      setTimeLeft(settings.workDuration * 60);
      
      if (settings.autoStartWork) {
        setIsRunning(true);
        sessionStartRef.current = new Date().toISOString();
      }
    }
  };

  const playNotificationSound = () => {
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5);
    
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.5);
  };

  const getCurrentDuration = (): number => {
    switch (mode) {
      case 'work':
        return settings.workDuration;
      case 'break':
        return settings.shortBreakDuration;
      case 'longBreak':
        return settings.longBreakDuration;
    }
  };

  const handleStart = () => {
    setIsRunning(true);
    if (!sessionStartRef.current) {
      sessionStartRef.current = new Date().toISOString();
    }
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(getCurrentDuration() * 60);
    sessionStartRef.current = null;
  };

  const handleModeChange = (newMode: TimerMode) => {
    setMode(newMode);
    setIsRunning(false);
    sessionStartRef.current = null;
    
    switch (newMode) {
      case 'work':
        setTimeLeft(settings.workDuration * 60);
        break;
      case 'break':
        setTimeLeft(settings.shortBreakDuration * 60);
        break;
      case 'longBreak':
        setTimeLeft(settings.longBreakDuration * 60);
        break;
    }
  };

  const handleSettingsChange = (newSettings: TimerSettingsType) => {
    setSettings(newSettings);
    saveTimerSettings(newSettings);
    setShowSettings(false);
    handleReset();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTodaysSessions = () => {
    return sessions.filter(
      (s) => s.completed && s.type === 'work' && isToday(new Date(s.startTime))
    );
  };

  const getWeeksSessions = () => {
    return sessions.filter(
      (s) => s.completed && s.type === 'work' && isThisWeek(new Date(s.startTime), { weekStartsOn: 1 })
    );
  };

  const getTotalFocusTime = (sessionList: TimerSession[]) => {
    const totalSeconds = sessionList.reduce((acc, s) => acc + s.duration, 0);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return { hours, minutes, totalSeconds };
  };

  const getRecentSessions = () => {
    return sessions
      .filter((s) => s.completed && s.type === 'work')
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(0, 5);
  };

  // const todayStats = getTotalFocusTime(todaysSessions);

  return (
    <div className="focus-layout">
      <div className="timer-container">
      <h1>Focus Timer</h1>
      
      <div className="timer-modes">
        <button
          className={`mode-btn ${mode === 'work' ? 'active' : ''}`}
          onClick={() => handleModeChange('work')}
        >
          Work
        </button>
        <button
          className={`mode-btn ${mode === 'break' ? 'active' : ''}`}
          onClick={() => handleModeChange('break')}
        >
          Short Break
        </button>
        <button
          className={`mode-btn ${mode === 'longBreak' ? 'active' : ''}`}
          onClick={() => handleModeChange('longBreak')}
        >
          Long Break
        </button>
      </div>

      <div className="timer-display">
        <div className="time">{formatTime(timeLeft)}</div>
        <div className="sessions-count">Sessions completed: {sessionsCompleted}</div>
      </div>

      <div className="timer-controls">
        {!isRunning ? (
          <button className="control-btn primary" onClick={handleStart}>
            <Play size={24} /> Start
          </button>
        ) : (
          <button className="control-btn" onClick={handlePause}>
            <Pause size={24} /> Pause
          </button>
        )}
        <button className="control-btn" onClick={handleReset}>
          <RotateCcw size={24} /> Reset
        </button>
        <button className="control-btn" onClick={() => setShowSettings(!showSettings)}>
          <Settings size={24} /> Settings
        </button>
        <button className="control-btn" onClick={() => setShowSummary(!showSummary)}>
          <TrendingUp size={24} /> Summary
        </button>
      </div>

      {showSettings && (
        <TimerSettingsPanel
          settings={settings}
          onSave={handleSettingsChange}
          onCancel={() => setShowSettings(false)}
        />
      )}
    </div>

    {showSummary && (
      <FocusSummary
        sessions={sessions}
        todaysSessions={getTodaysSessions()}
        weeksSessions={getWeeksSessions()}
        recentSessions={getRecentSessions()}
        getTotalFocusTime={getTotalFocusTime}
        onClose={() => setShowSummary(false)}
      />
    )}
  </div>
  );
}

interface TimerSettingsPanelProps {
  settings: TimerSettingsType;
  onSave: (settings: TimerSettingsType) => void;
  onCancel: () => void;
}

function TimerSettingsPanel({ settings, onSave, onCancel }: TimerSettingsPanelProps) {
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(localSettings);
  };

  return (
    <div className="settings-panel card">
      <h3>Timer Settings</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Work Duration (minutes)</label>
          <input
            type="number"
            min="1"
            max="60"
            value={localSettings.workDuration}
            onChange={(e) =>
              setLocalSettings({ ...localSettings, workDuration: parseInt(e.target.value) })
            }
          />
        </div>
        <div className="form-group">
          <label>Short Break Duration (minutes)</label>
          <input
            type="number"
            min="1"
            max="30"
            value={localSettings.shortBreakDuration}
            onChange={(e) =>
              setLocalSettings({ ...localSettings, shortBreakDuration: parseInt(e.target.value) })
            }
          />
        </div>
        <div className="form-group">
          <label>Long Break Duration (minutes)</label>
          <input
            type="number"
            min="1"
            max="60"
            value={localSettings.longBreakDuration}
            onChange={(e) =>
              setLocalSettings({ ...localSettings, longBreakDuration: parseInt(e.target.value) })
            }
          />
        </div>
        <div className="form-group">
          <label>Sessions Before Long Break</label>
          <input
            type="number"
            min="2"
            max="10"
            value={localSettings.sessionsBeforeLongBreak}
            onChange={(e) =>
              setLocalSettings({
                ...localSettings,
                sessionsBeforeLongBreak: parseInt(e.target.value),
              })
            }
          />
        </div>
        <div className="form-group checkbox">
          <label>
            <input
              type="checkbox"
              checked={localSettings.autoStartBreaks}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, autoStartBreaks: e.target.checked })
              }
            />
            Auto-start breaks
          </label>
        </div>
        <div className="form-group checkbox">
          <label>
            <input
              type="checkbox"
              checked={localSettings.autoStartWork}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, autoStartWork: e.target.checked })
              }
            />
            Auto-start work sessions
          </label>
        </div>
        <div className="form-group checkbox">
          <label>
            <input
              type="checkbox"
              checked={localSettings.soundEnabled}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, soundEnabled: e.target.checked })
              }
            />
            Enable sound notifications
          </label>
        </div>
        <div className="form-actions">
          <button type="submit" className="primary">
            Save
          </button>
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

interface FocusSummaryProps {
  sessions: TimerSession[];
  todaysSessions: TimerSession[];
  weeksSessions: TimerSession[];
  recentSessions: TimerSession[];
  getTotalFocusTime: (sessions: TimerSession[]) => { hours: number; minutes: number; totalSeconds: number };
  onClose: () => void;
}

function FocusSummary({
  sessions,
  todaysSessions,
  weeksSessions: _weeksSessions,
  recentSessions,
  getTotalFocusTime,
  onClose,
}: FocusSummaryProps) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [isChartExpanded, setIsChartExpanded] = useState(true);
  const [isWeeklyTrendExpanded, setIsWeeklyTrendExpanded] = useState(true);
  const [isDailyComparisonExpanded, setIsDailyComparisonExpanded] = useState(true);
  const allWorkSessions = sessions.filter((s) => s.completed && s.type === 'work');
  // const weekStats = getTotalFocusTime(weeksSessions);
  const totalStats = getTotalFocusTime(allWorkSessions);
  const todayStats = getTotalFocusTime(todaysSessions);

  // Get last 7 days sessions
  const last7DaysSessions = allWorkSessions.filter((s) => {
    const sessionDate = new Date(s.startTime);
    const daysAgo = Math.floor((new Date().getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysAgo < 7;
  });
  const last7DaysStats = getTotalFocusTime(last7DaysSessions);

  const getDailyFocusData = (offset: number = 0) => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), (offset * 7) + 6 - i);
      return startOfDay(date);
    });

    return last7Days.map((date) => {
      const daySessions = allWorkSessions.filter((s) =>
        isSameDay(new Date(s.startTime), date)
      );
      const totalMinutes = daySessions.reduce((acc, s) => acc + s.duration / 60, 0);
      
      return {
        date,
        dayLabel: format(date, 'EEE'),
        dateLabel: format(date, 'MMM d'),
        fullDate: format(date, 'MMM d, yyyy'),
        minutes: Math.round(totalMinutes),
        sessions: daySessions.length,
      };
    });
  };

  const getWeeklyComparisonData = () => {
    // Current week (last 7 days)
    const currentWeekSessions = allWorkSessions.filter((s) => 
      isThisWeek(new Date(s.startTime), { weekStartsOn: 1 })
    );
    const currentWeekMinutes = currentWeekSessions.reduce((acc, s) => acc + s.duration / 60, 0);

    // Previous week (8-14 days ago)
    const previousWeekStart = subDays(startOfWeek(new Date(), { weekStartsOn: 1 }), 7);
    const previousWeekEnd = subDays(previousWeekStart, -6);
    const previousWeekSessions = allWorkSessions.filter((s) => {
      const sessionDate = new Date(s.startTime);
      return sessionDate >= previousWeekStart && sessionDate <= previousWeekEnd;
    });
    const previousWeekMinutes = previousWeekSessions.reduce((acc, s) => acc + s.duration / 60, 0);

    return [
      {
        label: 'Previous Week',
        minutes: Math.round(previousWeekMinutes),
        sessions: previousWeekSessions.length,
        hours: Math.floor(previousWeekMinutes / 60),
        remainingMinutes: Math.round(previousWeekMinutes % 60),
      },
      {
        label: 'Current Week',
        minutes: Math.round(currentWeekMinutes),
        sessions: currentWeekSessions.length,
        hours: Math.floor(currentWeekMinutes / 60),
        remainingMinutes: Math.round(currentWeekMinutes % 60),
      },
    ];
  };

  const getDailyComparisonData = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday is 0

    // Last 7 days for each day of the week (current week)
    const currentWeekData = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(startOfDay(today), daysFromMonday - i);
      const daySessions = allWorkSessions.filter((s) =>
        isSameDay(new Date(s.startTime), date)
      );
      const totalMinutes = daySessions.reduce((acc, s) => acc + s.duration / 60, 0);
      
      return {
        dayLabel: format(date, 'EEE'),
        dateLabel: format(date, 'MMM d'),
        minutes: Math.round(totalMinutes),
        sessions: daySessions.length,
      };
    });

    // Previous week (same days, 7 days earlier)
    const previousWeekData = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(startOfDay(today), daysFromMonday - i + 7);
      const daySessions = allWorkSessions.filter((s) =>
        isSameDay(new Date(s.startTime), date)
      );
      const totalMinutes = daySessions.reduce((acc, s) => acc + s.duration / 60, 0);
      
      return {
        dayLabel: format(date, 'EEE'),
        dateLabel: format(date, 'MMM d'),
        minutes: Math.round(totalMinutes),
        sessions: daySessions.length,
      };
    });

    return { currentWeekData, previousWeekData };
  };

  const dailyData = getDailyFocusData(weekOffset);
  const weeklyComparisonData = getWeeklyComparisonData();
  const dailyComparisonData = getDailyComparisonData();
  const maxMinutes = Math.max(...dailyData.map((d) => d.minutes), 60);
  const maxHours = Math.ceil(maxMinutes / 60);
  const yAxisSteps = Array.from({ length: maxHours + 1 }, (_, i) => i);

  const maxWeeklyMinutes = Math.max(...weeklyComparisonData.map((w) => w.minutes), 60);
  const maxWeeklyHours = Math.ceil(maxWeeklyMinutes / 60);
  const weeklyYAxisSteps = Array.from({ length: maxWeeklyHours + 1 }, (_, i) => i);

  const allDailyComparisonMinutes = [
    ...dailyComparisonData.currentWeekData.map(d => d.minutes),
    ...dailyComparisonData.previousWeekData.map(d => d.minutes)
  ];
  const maxDailyComparisonMinutes = Math.max(...allDailyComparisonMinutes, 60);
  const maxDailyComparisonHours = Math.ceil(maxDailyComparisonMinutes / 60);
  const dailyComparisonYAxisSteps = Array.from({ length: maxDailyComparisonHours + 1 }, (_, i) => i);

  const weekRangeText = weekOffset === 0 
    ? 'This Week' 
    : `${dailyData[0].dateLabel} - ${dailyData[6].dateLabel}`;

  return (
    <div className="focus-summary card">
      <div className="summary-header">
        <h2>Focus Summary</h2>
        <button onClick={onClose} className="close-btn">
          ×
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <h3>Today</h3>
            <p className="stat-value">{todaysSessions.length}</p>
            <p className="stat-label">sessions</p>
            <p className="stat-time">
              {todayStats.hours}h {todayStats.minutes}m
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Calendar size={24} />
          </div>
          <div className="stat-content">
            <h3>Last 7 Days</h3>
            <p className="stat-value">{last7DaysSessions.length}</p>
            <p className="stat-label">sessions</p>
            <p className="stat-time">
              {last7DaysStats.hours}h {last7DaysStats.minutes}m
            </p>
          </div>
        </div>
      </div>

      <div className="daily-focus-chart">
        <div className="chart-header collapsible" onClick={() => setIsChartExpanded(!isChartExpanded)}>
          <h3>
            {isChartExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            Daily Focus Time
          </h3>
        </div>
        {isChartExpanded && (
        <>
        <div className="week-navigation">
          <button 
            className="week-nav-btn" 
            onClick={() => setWeekOffset(weekOffset + 1)}
            title="Previous week"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="week-range">{weekRangeText}</span>
          <button 
            className="week-nav-btn" 
            onClick={() => setWeekOffset(Math.max(0, weekOffset - 1))}
            disabled={weekOffset === 0}
            title="Next week"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="chart-container">
          <div className="y-axis">
            {yAxisSteps.reverse().map((hour) => (
              <div key={hour} className="y-axis-label">
                {hour}h
              </div>
            ))}
          </div>
          <div className="chart-area">
            <div className="bar-chart">
              {dailyData.map((day, index) => (
                <div key={index} className="bar-column">
                  <div className="bar-container">
                    <div
                      className="bar"
                      style={{ height: `${(day.minutes / maxMinutes) * 100}%` }}
                      title={`${day.fullDate}: ${day.minutes} minutes`}
                    >
                      {day.minutes > 0 && (
                        <span className="bar-value">{day.minutes}m</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="x-axis"></div>
            <div className="x-axis-labels">
              {dailyData.map((day, index) => (
                <div key={index} className="bar-label">
                  <div className="bar-day">{day.dayLabel}</div>
                  <div className="bar-date">{day.dateLabel}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        </>
        )}
      </div>

      <div className="weekly-trend-section">
        <div className="chart-header collapsible" onClick={() => setIsWeeklyTrendExpanded(!isWeeklyTrendExpanded)}>
          <h3>
            {isWeeklyTrendExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            Weekly Trend
          </h3>
        </div>
        {isWeeklyTrendExpanded && (
          <div className="weekly-comparison">
            <div className="chart-container">
              <div className="y-axis">
                {weeklyYAxisSteps.reverse().map((hour) => (
                  <div key={hour} className="y-axis-label">
                    {hour}h
                  </div>
                ))}
              </div>
              <div className="chart-area">
                <div className="bar-chart weekly">
                  {weeklyComparisonData.map((week, index) => (
                    <div key={index} className="bar-column weekly">
                      <div className="bar-container">
                        <div
                          className={`bar ${index === 1 ? 'current-week' : 'previous-week'}`}
                          style={{ height: `${(week.minutes / maxWeeklyMinutes) * 100}%` }}
                          title={`${week.label}: ${week.minutes} minutes (${week.sessions} sessions)`}
                        >
                          {week.minutes > 0 && (
                            <span className="bar-value">{week.hours}h {week.remainingMinutes}m</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="x-axis"></div>
                <div className="x-axis-labels">
                  {weeklyComparisonData.map((week, index) => (
                    <div key={index} className="bar-label">
                      <div className="bar-week-label">{week.label}</div>
                      <div className="bar-week-sessions">{week.sessions} sessions</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="daily-comparison-section">
        <div className="chart-header collapsible" onClick={() => setIsDailyComparisonExpanded(!isDailyComparisonExpanded)}>
          <h3>
            {isDailyComparisonExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            Daily Comparison
          </h3>
        </div>
        {isDailyComparisonExpanded && (
          <div className="daily-comparison">
            <div className="comparison-legend">
              <div className="legend-item">
                <span className="legend-color previous-week"></span>
                <span>Last Week</span>
              </div>
              <div className="legend-item">
                <span className="legend-color current-week"></span>
                <span>This Week</span>
              </div>
            </div>
            <div className="chart-container">
              <div className="y-axis">
                {dailyComparisonYAxisSteps.reverse().map((hour) => (
                  <div key={hour} className="y-axis-label">
                    {hour}h
                  </div>
                ))}
              </div>
              <div className="chart-area">
                <div className="bar-chart daily-comparison-chart">
                  {dailyComparisonData.currentWeekData.map((day, index) => (
                    <div key={index} className="bar-group">
                      <div className="bar-pair">
                        <div
                          className="bar previous-week-bar"
                          style={{ height: `${(dailyComparisonData.previousWeekData[index].minutes / maxDailyComparisonMinutes) * 100}%` }}
                          title={`Last week ${day.dayLabel}: ${dailyComparisonData.previousWeekData[index].minutes} minutes`}
                        >
                          {dailyComparisonData.previousWeekData[index].minutes > 0 && (
                            <span className="bar-value">{dailyComparisonData.previousWeekData[index].minutes}m</span>
                          )}
                        </div>
                        <div
                          className="bar current-week-bar"
                          style={{ height: `${(day.minutes / maxDailyComparisonMinutes) * 100}%` }}
                          title={`This week ${day.dayLabel}: ${day.minutes} minutes`}
                        >
                          {day.minutes > 0 && (
                            <span className="bar-value">{day.minutes}m</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="x-axis"></div>
                <div className="x-axis-labels">
                  {dailyComparisonData.currentWeekData.map((day, index) => (
                    <div key={index} className="bar-label">
                      <div className="bar-day">{day.dayLabel}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="recent-sessions">
        <h3>Recent Focus Sessions</h3>
        {recentSessions.length === 0 ? (
          <p className="empty-message">No focus sessions yet. Start your first session!</p>
        ) : (
          <div className="sessions-list">
            {recentSessions.map((session) => (
              <div key={session.id} className="session-item">
                <div className="session-info">
                  <div className="session-date">
                    {format(new Date(session.startTime), 'MMM d, yyyy')}
                  </div>
                  <div className="session-time">
                    {format(new Date(session.startTime), 'h:mm a')}
                  </div>
                </div>
                <div className="session-duration">
                  {Math.round(session.duration / 60)} min
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {allWorkSessions.length > 0 && (
        <div className="productivity-insights">
          <h3>Insights</h3>
          <div className="insight-item">
            <span className="insight-label">Average session length:</span>
            <span className="insight-value">
              {Math.round(totalStats.totalSeconds / allWorkSessions.length / 60)} minutes
            </span>
          </div>
          <div className="insight-item">
            <span className="insight-label">Most productive day:</span>
            <span className="insight-value">
              {getMostProductiveDay(allWorkSessions)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function getMostProductiveDay(sessions: TimerSession[]): string {
  const dayCounts: { [key: string]: number } = {};
  
  sessions.forEach((session) => {
    const day = format(new Date(session.startTime), 'EEEE');
    dayCounts[day] = (dayCounts[day] || 0) + 1;
  });

  const entries = Object.entries(dayCounts);
  if (entries.length === 0) return 'N/A';

  const [mostProductiveDay] = entries.reduce((a, b) => (a[1] > b[1] ? a : b));
  return mostProductiveDay;
}
