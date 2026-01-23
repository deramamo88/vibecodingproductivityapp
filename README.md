# Vibe Productivity App

A comprehensive productivity application combining timer, to-do list, habit tracking, goal-setting, and AI-powered suggestions.

## Features

- **Google SSO Authentication**: Secure sign-in with your Google account
- **Pomodoro Timer**: Focus sessions with customizable work/break intervals
- **To-Do List**: Task management with priorities, categories, and due dates
- **Habit Tracker**: Daily habit check-ins with streak tracking and visual progress
- **Goal Setting**: SMART goals with milestones and progress tracking
- **AI Suggestions**: Get personalized productivity recommendations powered by Google Gemini

## Tech Stack

- React 18 with TypeScript
- Vite for fast development and building
- Google OAuth 2.0 for authentication
- Google Gemini AI for smart suggestions
- Local Storage for data persistence
- Lucide React for icons
- Date-fns for date utilities

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Google Cloud Project with OAuth 2.0 credentials

### Installation

1. Clone the repository

2. Install dependencies:
```bash
npm install
```

3. Set up Google OAuth:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select existing one
   - Enable Google+ API
   - Go to Credentials → Create Credentials → OAuth 2.0 Client ID
   - Add authorized JavaScript origins:
     - `http://localhost:5173` (for development)
     - `https://yourdomain.github.io` (for production)
   - Add authorized redirect URIs:
     - `http://localhost:5173` (for development)
     - `https://yourdomain.github.io` (for production)
   - Copy your Client ID

4. Set up Firebase (for cloud data storage):
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable **Firestore Database** (Cloud Firestore)
   - Go to Project Settings → General
   - Scroll down to "Your apps" and add a Web app
   - Copy the Firebase configuration values

5. Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

6. Add your credentials to `.env`:
```env
VITE_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com

VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

7. Configure Firebase Security Rules:
   - Go to Firestore Database → Rules
   - Add these rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.token.email == userId;
    }
  }
}
```

8. (Optional) Set up Google Gemini AI:
   - Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Create an API key
   - Add it in the app's AI Settings menu

9. Start the development server:
```bash
npm run dev
```

10. Open your browser to `http://localhost:5173/vibecodingproductivityapp/`

### Build for Production

```bash
npm run build
```

The production-ready files will be in the `dist` folder.

### Deploy to GitHub Pages

```bash
npm run deploy
```

## Project Structure

```
src/
├── components/          # React components for each feature
│   ├── Timer/          # Pomodoro timer components
│   ├── TodoList/       # To-do list components
│   ├── HabitTracker/   # Habit tracking components
│   └── Goals/          # Goal setting components
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
│   └── storage.ts      # Local storage helpers
├── App.tsx             # Main app component
└── main.tsx            # Entry point
```

## Data Storage

All data is stored locally in your browser using LocalStorage. Your data stays private and on your device.
