import { useState } from 'react';
import { Key, Save, X, AlertCircle } from 'lucide-react';
import { getAIApiKey, setAIApiKey } from '../../utils/aiService';
import './AISettings.css';

interface AISettingsProps {
  onClose: () => void;
}

export default function AISettings({ onClose }: AISettingsProps) {
  const [apiKey, setApiKeyState] = useState(getAIApiKey() || '');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setAIApiKey(apiKey);
    setSaved(true);
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  const handleClear = () => {
    setApiKeyState('');
    setAIApiKey('');
  };

  return (
    <div className="ai-settings-overlay">
      <div className="ai-settings-modal card">
        <div className="ai-settings-header">
          <div className="header-title">
            <Key size={24} />
            <h2>AI Settings</h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="ai-settings-content">
          <div className="info-box">
            <AlertCircle size={18} />
            <p>
              Enter your Google Gemini API key to enable AI-powered suggestions. Your key is stored locally in your browser and never sent to our servers.
            </p>
          </div>

          <div className="form-group">
            <label htmlFor="api-key">Google Gemini API Key</label>
            <div className="api-key-input-wrapper">
              <input
                id="api-key"
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKeyState(e.target.value)}
                placeholder="AIza..."
                className="api-key-input"
              />
              <button
                type="button"
                className="toggle-visibility"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? 'Hide' : 'Show'}
              </button>
            </div>
            <small className="help-text">
              Get your free API key from{' '}
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">
                Google AI Studio
              </a>
            </small>
          </div>

          <div className="ai-features">
            <h3>AI Features</h3>
            <ul>
              <li>Smart goal breakdown and milestone suggestions</li>
              <li>Habit recommendations based on your goals</li>
              <li>Task prioritization and scheduling</li>
              <li>Focus pattern analysis and optimization</li>
              <li>Cross-module insights and connections</li>
            </ul>
          </div>

          {saved && (
            <div className="success-message">
              ✓ API key saved successfully!
            </div>
          )}
        </div>

        <div className="ai-settings-actions">
          <button className="secondary" onClick={handleClear}>
            Clear Key
          </button>
          <button
            className="primary"
            onClick={handleSave}
            disabled={!apiKey.trim() || saved}
          >
            <Save size={18} />
            {saved ? 'Saved!' : 'Save Key'}
          </button>
        </div>
      </div>
    </div>
  );
}
