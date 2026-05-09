import { useState, useMemo } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import AuthProvider from './components/AuthProvider';
import LoginScreen from './components/LoginScreen';
import SetupScreen from './components/SetupScreen';
import CallInterface from './components/CallInterface';
import SessionSummary from './components/SessionSummary';
import Dashboard from './components/Dashboard';
import { useAuth } from './services/auth';
import { Course, UploadResult } from './services/api';
import { StudyData, Achievement } from './services/studyData';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

type View = 'setup' | 'call' | 'summary' | 'dashboard' | 'advisor';

interface SessionResult {
  durationMinutes: number;
  messageCount: number;
  xpEarned: number;
  newAchievements: Achievement[];
  studyData: StudyData;
}

function AppContent() {
  const { user, isLoading, logout } = useAuth();
  const [view, setView] = useState<View>('setup');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [uploadedChunks, setUploadedChunks] = useState(0);
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null);
  const [userName, setUserName] = useState('');

  const sessionId = useMemo(
    () => `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    [],
  );

  const handleUploadComplete = (results: UploadResult[]) => {
    const newChunks = results
      .filter((r) => r.status === 'success')
      .reduce((sum, r) => sum + (r.chunks || 0), 0);
    setUploadedChunks((prev) => prev + newChunks);
  };

  const handleEndCall = (result: SessionResult) => {
    setSessionResult(result);
    setView('summary');
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-tutr-darker flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  const effectiveName = userName || user.name;

  if (view === 'dashboard') {
    return <Dashboard onBack={() => setView('setup')} user={user} onLogout={logout} />;
  }

  if (view === 'advisor') {
    return (
      <Dashboard
        onBack={() => setView('setup')}
        studentName={effectiveName || 'Student'}
        isAdvisorView
        user={user}
        onLogout={logout}
      />
    );
  }

  if (view === 'summary' && sessionResult) {
    return (
      <SessionSummary
        durationMinutes={sessionResult.durationMinutes}
        messageCount={sessionResult.messageCount}
        xpEarned={sessionResult.xpEarned}
        newAchievements={sessionResult.newAchievements}
        studyData={sessionResult.studyData}
        onContinue={() => setView('setup')}
      />
    );
  }

  if (view === 'call') {
    return (
      <CallInterface
        sessionId={sessionId}
        selectedCourse={selectedCourse}
        onSelectCourse={setSelectedCourse}
        uploadedChunks={uploadedChunks}
        onUploadComplete={handleUploadComplete}
        onEndCall={handleEndCall}
        userName={effectiveName}
      />
    );
  }

  return (
    <SetupScreen
      sessionId={sessionId}
      onStart={() => setView('call')}
      selectedCourse={selectedCourse}
      onSelectCourse={setSelectedCourse}
      onUploadComplete={handleUploadComplete}
      onViewDashboard={() => setView('dashboard')}
      onViewAdvisor={() => setView('advisor')}
      userName={userName || user.name}
      onUserNameChange={setUserName}
      user={user}
      onLogout={logout}
    />
  );
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
