import { Flame, Zap, Clock, MessageSquare, ArrowRight } from 'lucide-react';
import { StudyData, getLevel, Achievement } from '../services/studyData';

interface SessionSummaryProps {
  durationMinutes: number;
  messageCount: number;
  xpEarned: number;
  newAchievements: Achievement[];
  studyData: StudyData;
  onContinue: () => void;
}

export default function SessionSummary({
  durationMinutes, messageCount, xpEarned,
  newAchievements, studyData, onContinue,
}: SessionSummaryProps) {
  const levelInfo = getLevel(studyData.totalXp);
  const xpPercent = Math.min(100, (levelInfo.currentXp / levelInfo.xpNeeded) * 100);

  return (
    <div className="h-screen bg-tutr-darker flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <h2 className="text-2xl font-bold mb-2">Session Complete</h2>
        <p className="text-gray-400 text-sm mb-8">Great work today! Here's your summary.</p>

        {/* XP earned */}
        <div className="glass rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Zap size={24} className="text-yellow-400" />
            <span className="text-4xl font-bold text-yellow-400">+{xpEarned}</span>
            <span className="text-lg text-yellow-400/60">XP</span>
          </div>

          {/* Level progress */}
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs text-gray-500">Lv.{levelInfo.level}</span>
            <div className="flex-1 h-2 bg-tutr-darker rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-tutr-accent to-yellow-400 rounded-full transition-all duration-1000"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
            <span className="text-xs text-gray-500">Lv.{levelInfo.level + 1}</span>
          </div>
          <p className="text-[10px] text-gray-600">{levelInfo.currentXp} / {levelInfo.xpNeeded} XP to next level</p>

          {studyData.currentStreak > 0 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <Flame size={16} className="text-orange-400" />
              <span className="text-sm font-medium text-orange-400">
                {studyData.currentStreak}-day streak
                {studyData.currentStreak >= 3 && ' (bonus XP active!)'}
              </span>
            </div>
          )}
        </div>

        {/* Session stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="glass-light rounded-xl p-3">
            <Clock size={16} className="mx-auto mb-1 text-blue-400" />
            <p className="text-lg font-bold">{durationMinutes}m</p>
            <p className="text-[10px] text-gray-500">Study Time</p>
          </div>
          <div className="glass-light rounded-xl p-3">
            <MessageSquare size={16} className="mx-auto mb-1 text-green-400" />
            <p className="text-lg font-bold">{messageCount}</p>
            <p className="text-[10px] text-gray-500">Messages</p>
          </div>
        </div>

        {/* New achievements */}
        {newAchievements.length > 0 && (
          <div className="mb-6 space-y-2">
            <p className="text-xs text-tutr-accent font-medium uppercase tracking-wider">New Achievements</p>
            {newAchievements.map((a) => (
              <div key={a.id} className="glass rounded-xl p-3 flex items-center gap-3">
                <span className="text-2xl">{a.icon}</span>
                <div className="text-left">
                  <p className="text-sm font-semibold">{a.name}</p>
                  <p className="text-xs text-gray-500">{a.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={onContinue}
          className="flex items-center justify-center gap-2 mx-auto px-8 py-3 bg-tutr-accent hover:bg-tutr-accent/80 text-white font-medium rounded-xl transition-all"
        >
          Continue <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
