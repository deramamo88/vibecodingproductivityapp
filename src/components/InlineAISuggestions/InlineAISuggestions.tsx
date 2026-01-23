import { useState } from 'react';
import { Sparkles, Loader, X } from 'lucide-react';
import { generateAISuggestions, generateFallbackSuggestions, hasAIApiKey, AISuggestion } from '../../utils/aiService';
import { Goal, Habit, Task, TimerSession } from '../../types';
import './InlineAISuggestions.css';

interface InlineAISuggestionsProps {
  type: 'goal' | 'habit' | 'task';
  goals: Goal[];
  habits: Habit[];
  tasks: Task[];
  sessions: TimerSession[];
  onAdd: (suggestion: AISuggestion) => void;
  onOpenSettings: () => void;
}

export default function InlineAISuggestions({
  type,
  goals,
  habits,
  tasks,
  sessions,
  onAdd,
  onOpenSettings,
}: InlineAISuggestionsProps) {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleGenerateSuggestions = async () => {
    setLoading(true);
    setError(null);
    setShowSuggestions(true);

    try {
      let allSuggestions: AISuggestion[];

      if (hasAIApiKey()) {
        try {
          allSuggestions = await generateAISuggestions(goals, habits, tasks, sessions);
        } catch (aiError) {
          console.error('AI suggestion error:', aiError);
          const errorMessage = aiError instanceof Error ? aiError.message : '';
          
          // Check if it's a rate limit or API error
          if (errorMessage.includes('RATE_LIMIT')) {
            setError('OpenAI rate limit reached. Showing basic suggestions instead.');
          } else if (errorMessage.includes('INVALID_KEY')) {
            setError('Invalid API key. Showing basic suggestions instead.');
          } else {
            setError('AI service unavailable. Showing basic suggestions instead.');
          }
          
          // Fallback to basic suggestions
          allSuggestions = generateFallbackSuggestions(goals, habits, tasks, sessions);
        }
      } else {
        allSuggestions = generateFallbackSuggestions(goals, habits, tasks, sessions);
      }

      // Filter suggestions by type
      const filteredSuggestions = allSuggestions.filter(s => s.type === type);
      setSuggestions(filteredSuggestions);
    } catch (err) {
      console.error('Error generating suggestions:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate suggestions');
      
      // Fallback to basic suggestions on error
      const fallback = generateFallbackSuggestions(goals, habits, tasks, sessions);
      setSuggestions(fallback.filter(s => s.type === type));
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = (suggestion: AISuggestion) => {
    onAdd(suggestion);
    setSuggestions(suggestions.filter(s => s.id !== suggestion.id));
  };

  const handleDismiss = (id: string) => {
    setSuggestions(suggestions.filter(s => s.id !== id));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#3b82f6';
      default: return '#64748b';
    }
  };

  return (
    <div className="inline-ai-container">
      <button 
        className="ai-suggest-btn" 
        onClick={handleGenerateSuggestions}
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader className="spinning" size={16} />
            Analyzing...
          </>
        ) : (
          <>
            <Sparkles size={16} />
            AI Suggestions
          </>
        )}
      </button>

      {showSuggestions && (
        <div className="suggestions-panel">
          <div className="suggestions-header">
            <h4>AI Suggestions</h4>
            <button className="close-panel" onClick={() => setShowSuggestions(false)}>
              <X size={18} />
            </button>
          </div>

          {error && (
            <div className="setup-notice" style={{ background: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.2)' }}>
              <p>{error}</p>
              {!hasAIApiKey() && (
                <button onClick={onOpenSettings} className="setup-link-btn">
                  Setup AI Settings
                </button>
              )}
            </div>
          )}

          {suggestions.length === 0 && !loading && (
            <div className="no-suggestions">
              <p>No {type} suggestions available right now.</p>
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="suggestions-list-inline">
              {suggestions.map((suggestion) => (
                <div 
                  key={suggestion.id} 
                  className="suggestion-item-inline"
                  style={{ borderLeftColor: getPriorityColor(suggestion.priority) }}
                >
                  <div className="suggestion-content">
                    <h5>{suggestion.title}</h5>
                    <p>{suggestion.description}</p>
                    {suggestion.reasoning && (
                      <small className="reasoning">{suggestion.reasoning}</small>
                    )}
                  </div>
                  <div className="suggestion-actions-inline">
                    <button 
                      className="accept-btn-inline"
                      onClick={() => handleAccept(suggestion)}
                    >
                      Add
                    </button>
                    <button 
                      className="dismiss-btn-inline"
                      onClick={() => handleDismiss(suggestion.id)}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
