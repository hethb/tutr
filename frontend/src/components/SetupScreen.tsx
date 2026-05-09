import { useState, useEffect } from 'react';
import {
  Video, ArrowRight, Sparkles, Mic, Monitor,
  BarChart3, ShieldCheck, Flame, LogOut,
} from 'lucide-react';
import FileUpload from './FileUpload';
import CourseSelector from './CourseSelector';
import StudyStats from './StudyStats';
import { Course, UploadResult } from '../services/api';
import { loadStudyDataFromApi, StudyData, loadStudyData } from '../services/studyData';
import type { User } from '../services/auth';

interface SetupScreenProps {
  sessionId: string;
  onStart: () => void;
  selectedCourse: Course | null;
  onSelectCourse: (course: Course | null) => void;
  onUploadComplete: (results: UploadResult[]) => void;
  onViewDashboard: () => void;
  onViewAdvisor: () => void;
  userName: string;
  onUserNameChange: (name: string) => void;
  user: User;
  onLogout: () => void;
}

export default function SetupScreen({
  sessionId, onStart, selectedCourse, onSelectCourse, onUploadComplete,
  onViewDashboard, onViewAdvisor, userName, onUserNameChange, user, onLogout,
}: SetupScreenProps) {
  const [step, setStep] = useState(0);
  const [studyData, setStudyData] = useState<StudyData>(loadStudyData());

  useEffect(() => {
    loadStudyDataFromApi().then(setStudyData);
  }, []);

  return (
    <div className="h-screen bg-tutr-darker flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
            <Sparkles size={16} className="text-tutr-accent" />
            <span className="text-sm font-medium text-tutr-accent-light">AI-Powered Tutoring</span>
          </div>
          <h1 className="text-5xl font-bold mb-3">
            <span className="bg-gradient-to-r from-tutr-accent to-tutr-accent-light bg-clip-text text-transparent">
              Tutr
            </span>
          </h1>
          <p className="text-lg text-gray-400 max-w-md mx-auto">
            Your personal AI study partner. Upload your materials, pick your course, and start learning.
          </p>
        </div>

        {/* User info bar */}
        <div className="glass rounded-2xl p-3 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-tutr-accent/20 flex items-center justify-center text-xs font-bold text-tutr-accent">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-[10px] text-gray-500">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-tutr-surface-light transition-all"
            title="Sign out"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>

        {/* Streak / Stats banner (if returning user) */}
        {studyData.totalXp > 0 && (
          <div className="glass rounded-2xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {studyData.currentStreak > 0 && (
                <div className="flex items-center gap-2">
                  <Flame size={20} className="text-orange-400" />
                  <div>
                    <p className="text-sm font-bold text-orange-400">{studyData.currentStreak}-day streak</p>
                    <p className="text-[10px] text-gray-500">Keep it going!</p>
                  </div>
                </div>
              )}
              <StudyStats data={studyData} compact />
            </div>
            <div className="flex gap-2">
              <button
                onClick={onViewDashboard}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-tutr-surface-light transition-all"
              >
                <BarChart3 size={14} />
                My Progress
              </button>
              <button
                onClick={onViewAdvisor}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-tutr-surface-light transition-all"
              >
                <ShieldCheck size={14} />
                Advisor View
              </button>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { icon: Video, title: 'Face-to-Face', desc: 'Video call experience with your AI tutor' },
            { icon: Mic, title: 'Voice Chat', desc: 'Talk naturally like a real tutoring session' },
            { icon: Monitor, title: 'Screen Share', desc: 'Show your work and solve problems together' },
          ].map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="glass rounded-2xl p-4 text-center">
                <div className="w-10 h-10 rounded-xl bg-tutr-accent/10 flex items-center justify-center mx-auto mb-3">
                  <Icon size={20} className="text-tutr-accent" />
                </div>
                <h3 className="text-sm font-semibold mb-1">{feature.title}</h3>
                <p className="text-xs text-gray-500">{feature.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Setup Card */}
        <div className="glass rounded-2xl p-6 space-y-6">
          {/* Steps */}
          <div className="flex gap-2">
            {['Your Name', 'Materials', 'Course', 'Ready'].map((label, i) => (
              <button
                key={label}
                onClick={() => setStep(i)}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                  i === step
                    ? 'bg-tutr-accent text-white'
                    : i < step
                      ? 'bg-tutr-success/20 text-tutr-success'
                      : 'bg-tutr-surface-light text-gray-500'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {step === 0 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">What's your name?</h3>
                <p className="text-sm text-gray-400">
                  This helps personalize your session. Alex will greet you by name.
                </p>
              </div>
              <input
                type="text"
                value={userName}
                onChange={(e) => onUserNameChange(e.target.value)}
                placeholder={user.name || 'Enter your name...'}
                className="w-full px-4 py-3 bg-tutr-surface-light rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-tutr-accent/50 text-sm"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && setStep(1)}
              />
              <div className="flex justify-end">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-tutr-accent hover:bg-tutr-accent/80 text-white text-sm font-medium rounded-xl transition-all"
                >
                  Next <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">Upload Your Materials</h3>
                <p className="text-sm text-gray-400">
                  Add lecture slides, notes, textbooks, or any study materials. Alex will reference these during your session.
                </p>
              </div>
              <FileUpload sessionId={sessionId} onUploadComplete={onUploadComplete} />
              <div className="flex justify-between">
                <button onClick={() => setStep(0)} className="px-6 py-2.5 text-gray-400 hover:text-white text-sm font-medium rounded-xl transition-all">Back</button>
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-tutr-accent hover:bg-tutr-accent/80 text-white text-sm font-medium rounded-xl transition-all"
                >
                  Next <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">Select Your Course</h3>
                <p className="text-sm text-gray-400">
                  Choose a course from the list, or type in your university and course number.
                </p>
              </div>
              <CourseSelector selectedCourse={selectedCourse} onSelectCourse={onSelectCourse} />
              <div className="flex justify-between">
                <button onClick={() => setStep(1)} className="px-6 py-2.5 text-gray-400 hover:text-white text-sm font-medium rounded-xl transition-all">Back</button>
                <button
                  onClick={() => setStep(3)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-tutr-accent hover:bg-tutr-accent/80 text-white text-sm font-medium rounded-xl transition-all"
                >
                  Next <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <div className="w-20 h-20 rounded-full bg-tutr-accent/10 flex items-center justify-center mx-auto mb-4">
                  <Video size={32} className="text-tutr-accent" />
                </div>
                <h3 className="text-lg font-semibold mb-1">
                  Ready to go{(userName || user.name) ? `, ${userName || user.name}` : ''}!
                </h3>
                <p className="text-sm text-gray-400 max-w-sm mx-auto">
                  You'll join a video call with Alex, your AI tutor. Enable your camera, share your screen, and chat via voice or text.
                </p>
                {selectedCourse && (
                  <p className="text-xs text-tutr-accent mt-2">
                    {selectedCourse.custom
                      ? `${selectedCourse.university || ''} ${selectedCourse.courseNumber || ''}`.trim()
                      : selectedCourse.name}
                  </p>
                )}
              </div>
              <div className="flex justify-between">
                <button onClick={() => setStep(2)} className="px-6 py-2.5 text-gray-400 hover:text-white text-sm font-medium rounded-xl transition-all">Back</button>
                <button
                  onClick={onStart}
                  className="flex items-center gap-2 px-8 py-3 bg-tutr-success hover:bg-tutr-success/80 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-tutr-success/20"
                >
                  <Video size={18} />
                  Start Session
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom links */}
        <div className="flex items-center justify-center gap-6 mt-6">
          <button
            onClick={onViewDashboard}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-tutr-accent transition-colors"
          >
            <BarChart3 size={14} />
            View Dashboard
          </button>
          <button
            onClick={onViewAdvisor}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-tutr-accent transition-colors"
          >
            <ShieldCheck size={14} />
            Parent/Advisor View
          </button>
        </div>

        <p className="text-center text-xs text-gray-600 mt-4">
          Powered by Groq (free). Get your API key at groq.com. Browser mic & camera access needed for full experience.
        </p>
      </div>
    </div>
  );
}
