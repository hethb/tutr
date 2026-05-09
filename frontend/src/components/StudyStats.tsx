import { Flame, Zap, Clock, MessageSquare, Trophy } from 'lucide-react';
import { StudyData, getLevel } from '../services/studyData';

interface StudyStatsProps {
  data: StudyData;
  compact?: boolean;
}

export default function StudyStats({ data, compact }: StudyStatsProps) {
  const levelInfo = getLevel(data.totalXp);
  const xpPercent = Math.min(100, (levelInfo.currentXp / levelInfo.xpNeeded) * 100);

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5" title={`${data.currentStreak}-day streak`}>
          <Flame size={14} className={data.currentStreak > 0 ? 'text-orange-400' : 'text-gray-600'} />
          <span className="text-xs font-bold text-orange-400">{data.currentStreak}</span>
        </div>
        <div className="flex items-center gap-1.5" title={`Level ${levelInfo.level}`}>
          <Zap size={14} className="text-yellow-400" />
          <span className="text-xs font-bold text-yellow-400">Lv.{levelInfo.level}</span>
        </div>
        <div className="h-1.5 w-16 bg-tutr-surface rounded-full overflow-hidden" title={`${levelInfo.currentXp}/${levelInfo.xpNeeded} XP`}>
          <div
            className="h-full bg-gradient-to-r from-tutr-accent to-yellow-400 rounded-full transition-all duration-500"
            style={{ width: `${xpPercent}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Level & XP */}
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
              <span className="text-sm font-bold text-white">{levelInfo.level}</span>
            </div>
            <div>
              <p className="text-sm font-semibold">Level {levelInfo.level}</p>
              <p className="text-[10px] text-gray-500">{levelInfo.currentXp} / {levelInfo.xpNeeded} XP</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-yellow-400">{data.totalXp.toLocaleString()}</p>
            <p className="text-[10px] text-gray-500">Total XP</p>
          </div>
        </div>
        <div className="h-2 bg-tutr-darker rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-tutr-accent via-purple-400 to-yellow-400 rounded-full transition-all duration-700"
            style={{ width: `${xpPercent}%` }}
          />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-light rounded-xl p-3 text-center">
          <Flame size={20} className={`mx-auto mb-1 ${data.currentStreak > 0 ? 'text-orange-400' : 'text-gray-600'}`} />
          <p className="text-2xl font-bold">{data.currentStreak}</p>
          <p className="text-[10px] text-gray-500">Day Streak</p>
          {data.longestStreak > data.currentStreak && (
            <p className="text-[9px] text-gray-600 mt-0.5">Best: {data.longestStreak}</p>
          )}
        </div>
        <div className="glass-light rounded-xl p-3 text-center">
          <Clock size={20} className="mx-auto mb-1 text-blue-400" />
          <p className="text-2xl font-bold">{Math.round(data.totalStudyMinutes / 60 * 10) / 10}</p>
          <p className="text-[10px] text-gray-500">Hours Studied</p>
        </div>
        <div className="glass-light rounded-xl p-3 text-center">
          <MessageSquare size={20} className="mx-auto mb-1 text-green-400" />
          <p className="text-2xl font-bold">{data.totalMessages}</p>
          <p className="text-[10px] text-gray-500">Questions Asked</p>
        </div>
        <div className="glass-light rounded-xl p-3 text-center">
          <Trophy size={20} className="mx-auto mb-1 text-purple-400" />
          <p className="text-2xl font-bold">{data.sessions.length}</p>
          <p className="text-[10px] text-gray-500">Sessions</p>
        </div>
      </div>
    </div>
  );
}
