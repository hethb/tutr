import { useState, useEffect } from 'react';
import {
  ArrowLeft, Flame, Zap, Clock, MessageSquare, Trophy,
  Calendar, TrendingUp, Award, Target, BookOpen, ChevronDown, ChevronUp,
  LogOut,
} from 'lucide-react';
import {
  StudyData, loadStudyDataFromApi, loadStudyData, getLevel, getWeeklyStudyMinutes,
  getRecentTopics, ACHIEVEMENTS,
} from '../services/studyData';
import { fetchSessionHistory, fetchSessionDetail, SessionRecord, SessionDetail } from '../services/api';
import StudyStats from './StudyStats';
import type { User } from '../services/auth';

interface DashboardProps {
  onBack: () => void;
  studentName?: string;
  isAdvisorView?: boolean;
  user?: User;
  onLogout?: () => void;
}

export default function Dashboard({ onBack, studentName, isAdvisorView, user, onLogout }: DashboardProps) {
  const [data, setData] = useState<StudyData>(loadStudyData());
  const [pastSessions, setPastSessions] = useState<SessionRecord[]>([]);
  const [expandedSession, setExpandedSession] = useState<number | null>(null);
  const [expandedMessages, setExpandedMessages] = useState<{ role: string; content: string }[]>([]);
  const [loadingTranscript, setLoadingTranscript] = useState(false);

  useEffect(() => {
    loadStudyDataFromApi().then(setData);
    fetchSessionHistory(50).then(setPastSessions).catch(() => {});
  }, []);

  const weeklyMinutes = getWeeklyStudyMinutes(data);
  const maxWeekly = Math.max(...weeklyMinutes, 30);
  const recentTopics = getRecentTopics(data);
  const levelInfo = getLevel(data.totalXp);

  const weeklyTotal = weeklyMinutes.reduce((a, b) => a + b, 0);
  const weeklyGoalPercent = Math.min(100, (weeklyTotal / data.weeklyGoalMinutes) * 100);

  const dayLabels: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dayLabels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
  }

  const streakDays: { date: string; active: boolean }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const active = data.sessions.some((s) => s.date === dateStr);
    streakDays.push({ date: dateStr, active });
  }

  const toggleTranscript = async (sessionId: number) => {
    if (expandedSession === sessionId) {
      setExpandedSession(null);
      setExpandedMessages([]);
      return;
    }
    setLoadingTranscript(true);
    try {
      const detail = await fetchSessionDetail(sessionId);
      setExpandedMessages(detail.messages || []);
      setExpandedSession(sessionId);
    } catch {
      setExpandedMessages([]);
      setExpandedSession(sessionId);
    } finally {
      setLoadingTranscript(false);
    }
  };

  return (
    <div className="h-screen bg-tutr-darker overflow-y-auto">
      {/* Header */}
      <div className="glass border-b border-gray-800 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-xl bg-tutr-surface-light flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-xl font-bold">
                {isAdvisorView ? `${studentName || 'Student'}'s Progress` : 'Your Progress'}
              </h1>
              <p className="text-xs text-gray-500">
                {isAdvisorView ? 'Parent / Advisor Dashboard' : 'Study Dashboard'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Flame size={16} className={data.currentStreak > 0 ? 'text-orange-400' : 'text-gray-600'} />
              <span className="text-sm font-bold text-orange-400">{data.currentStreak} day streak</span>
            </div>
            <div className="flex items-center gap-1.5 bg-tutr-surface-light px-3 py-1.5 rounded-lg">
              <Zap size={14} className="text-yellow-400" />
              <span className="text-sm font-bold">Lv.{levelInfo.level}</span>
            </div>
            {user && onLogout && (
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-tutr-surface-light transition-all"
                title="Sign out"
              >
                <LogOut size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
        {/* Top row */}
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
            <StudyStats data={data} />
          </div>
          <div className="glass rounded-2xl p-4 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <Target size={16} className="text-tutr-accent" />
              <h3 className="text-sm font-semibold">Weekly Goal</h3>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="relative w-28 h-28">
                <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#232341" strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r="42" fill="none"
                    stroke="url(#goalGrad)" strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${weeklyGoalPercent * 2.64} 264`}
                  />
                  <defs>
                    <linearGradient id="goalGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#6c5ce7" />
                      <stop offset="100%" stopColor="#00b894" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-bold">{Math.round(weeklyGoalPercent)}%</span>
                  <span className="text-[9px] text-gray-500">{weeklyTotal}m / {data.weeklyGoalMinutes}m</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Activity Chart */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-tutr-accent" />
            <h3 className="text-sm font-semibold">This Week's Activity</h3>
          </div>
          <div className="flex items-end gap-2 h-32">
            {weeklyMinutes.map((mins, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[9px] text-gray-500">{mins}m</span>
                <div className="w-full bg-tutr-darker rounded-lg overflow-hidden" style={{ height: '100px' }}>
                  <div
                    className="w-full bg-gradient-to-t from-tutr-accent to-tutr-accent-light rounded-lg transition-all duration-500"
                    style={{
                      height: `${Math.max(2, (mins / maxWeekly) * 100)}%`,
                      marginTop: `${100 - Math.max(2, (mins / maxWeekly) * 100)}%`,
                    }}
                  />
                </div>
                <span className="text-[9px] text-gray-600">{dayLabels[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Streak Calendar + Achievements */}
        <div className="grid grid-cols-2 gap-6">
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={16} className="text-orange-400" />
              <h3 className="text-sm font-semibold">Last 30 Days</h3>
            </div>
            <div className="grid grid-cols-10 gap-1.5">
              {streakDays.map((day, i) => (
                <div
                  key={i}
                  className={`w-full aspect-square rounded-md transition-all ${
                    day.active
                      ? 'bg-gradient-to-br from-orange-400 to-orange-600'
                      : 'bg-tutr-darker'
                  }`}
                  title={`${day.date}: ${day.active ? 'Studied' : 'No activity'}`}
                />
              ))}
            </div>
            <div className="flex items-center gap-3 mt-3 text-[9px] text-gray-500">
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-sm bg-tutr-darker" />
                No activity
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-sm bg-gradient-to-br from-orange-400 to-orange-600" />
                Studied
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Award size={16} className="text-purple-400" />
                <h3 className="text-sm font-semibold">Achievements</h3>
              </div>
              <span className="text-[10px] text-gray-500">
                {data.unlockedAchievements.length}/{ACHIEVEMENTS.length}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
              {ACHIEVEMENTS.map((a) => {
                const unlocked = data.unlockedAchievements.includes(a.id);
                return (
                  <div
                    key={a.id}
                    className={`flex flex-col items-center p-2 rounded-lg transition-all ${
                      unlocked ? 'glass-light' : 'opacity-30'
                    }`}
                    title={`${a.name}: ${a.description}`}
                  >
                    <span className="text-xl">{a.icon}</span>
                    <span className="text-[8px] text-center text-gray-400 mt-1 leading-tight">{a.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Past Calls / Session History */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={16} className="text-tutr-accent" />
            <h3 className="text-sm font-semibold">Past Calls</h3>
          </div>
          {pastSessions.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">No sessions yet. Start studying to see your history!</p>
          ) : (
            <div className="space-y-2 max-h-[32rem] overflow-y-auto">
              {pastSessions.map((s) => (
                <div key={s.id} className="glass-light rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleTranscript(s.id)}
                    className="w-full flex items-center gap-4 p-3 hover:bg-tutr-surface-light/50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-tutr-accent/10 flex items-center justify-center flex-shrink-0">
                      <BookOpen size={16} className="text-tutr-accent" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium">{s.course || 'General Study'}</p>
                      <p className="text-[10px] text-gray-500">
                        {new Date(s.start_time).toLocaleDateString()} · {s.duration_minutes}m · {s.message_count} messages
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 mr-2">
                      <p className="text-sm font-bold text-yellow-400">+{s.xp_earned}</p>
                      <p className="text-[9px] text-gray-500">XP</p>
                    </div>
                    <div className="flex-shrink-0 text-gray-500">
                      {expandedSession === s.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </button>

                  {expandedSession === s.id && (
                    <div className="border-t border-gray-800 p-3 max-h-80 overflow-y-auto">
                      {loadingTranscript ? (
                        <p className="text-xs text-gray-500 text-center py-4 animate-pulse">Loading transcript...</p>
                      ) : expandedMessages.length === 0 ? (
                        <p className="text-xs text-gray-500 text-center py-4">No transcript available for this session.</p>
                      ) : (
                        <div className="space-y-2">
                          {expandedMessages.map((msg, i) => (
                            <div
                              key={i}
                              className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[80%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                                  msg.role === 'user'
                                    ? 'bg-tutr-accent/20 text-tutr-accent-light'
                                    : 'bg-tutr-surface-light text-gray-300'
                                }`}
                              >
                                <p className="text-[9px] font-semibold mb-0.5 opacity-60">
                                  {msg.role === 'user' ? 'You' : 'Alex'}
                                </p>
                                {msg.content}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Advisor note */}
        {isAdvisorView && (
          <div className="glass rounded-2xl p-5 border border-tutr-accent/20">
            <h3 className="text-sm font-semibold mb-2">Advisor Notes</h3>
            <p className="text-xs text-gray-400">
              {data.currentStreak > 0
                ? `Great consistency! ${studentName || 'The student'} has been studying for ${data.currentStreak} days in a row.`
                : `${studentName || 'The student'} hasn't studied recently. Consider checking in.`}
              {' '}Total study time is {Math.round(data.totalStudyMinutes / 60 * 10) / 10} hours
              across {data.sessions.length + pastSessions.length} sessions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
