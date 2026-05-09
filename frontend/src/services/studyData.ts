import { fetchUserStats, saveUserStats as saveUserStatsApi, UserStats } from './api';

const STORAGE_KEY = 'tutr_study_data';

export interface StudySession {
  id: string;
  date: string;
  startTime: number;
  endTime: number;
  durationMinutes: number;
  course: string | null;
  topicsCovered: string[];
  messageCount: number;
  xpEarned: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: string | null;
  requirement: (data: StudyData) => boolean;
}

export interface StudyData {
  sessions: StudySession[];
  currentStreak: number;
  longestStreak: number;
  totalXp: number;
  level: number;
  lastStudyDate: string | null;
  unlockedAchievements: string[];
  totalMessages: number;
  totalStudyMinutes: number;
  weeklyGoalMinutes: number;
}

const DEFAULT_DATA: StudyData = {
  sessions: [],
  currentStreak: 0,
  longestStreak: 0,
  totalXp: 0,
  level: 1,
  lastStudyDate: null,
  unlockedAchievements: [],
  totalMessages: 0,
  totalStudyMinutes: 0,
  weeklyGoalMinutes: 120,
};

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_session',
    name: 'First Steps',
    description: 'Complete your first tutoring session',
    icon: '🎯',
    unlockedAt: null,
    requirement: (d) => d.sessions.length >= 1,
  },
  {
    id: 'streak_3',
    name: 'On a Roll',
    description: 'Maintain a 3-day study streak',
    icon: '🔥',
    unlockedAt: null,
    requirement: (d) => d.longestStreak >= 3,
  },
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day study streak',
    icon: '⚡',
    unlockedAt: null,
    requirement: (d) => d.longestStreak >= 7,
  },
  {
    id: 'streak_30',
    name: 'Unstoppable',
    description: '30-day study streak!',
    icon: '👑',
    unlockedAt: null,
    requirement: (d) => d.longestStreak >= 30,
  },
  {
    id: 'hours_1',
    name: 'Getting Started',
    description: 'Study for 1 hour total',
    icon: '📖',
    unlockedAt: null,
    requirement: (d) => d.totalStudyMinutes >= 60,
  },
  {
    id: 'hours_10',
    name: 'Dedicated Learner',
    description: 'Study for 10 hours total',
    icon: '📚',
    unlockedAt: null,
    requirement: (d) => d.totalStudyMinutes >= 600,
  },
  {
    id: 'hours_50',
    name: 'Scholar',
    description: '50 hours of study!',
    icon: '🎓',
    unlockedAt: null,
    requirement: (d) => d.totalStudyMinutes >= 3000,
  },
  {
    id: 'messages_50',
    name: 'Curious Mind',
    description: 'Ask 50 questions',
    icon: '💬',
    unlockedAt: null,
    requirement: (d) => d.totalMessages >= 50,
  },
  {
    id: 'messages_200',
    name: 'Deep Thinker',
    description: 'Ask 200 questions',
    icon: '🧠',
    unlockedAt: null,
    requirement: (d) => d.totalMessages >= 200,
  },
  {
    id: 'level_5',
    name: 'Rising Star',
    description: 'Reach level 5',
    icon: '⭐',
    unlockedAt: null,
    requirement: (d) => d.level >= 5,
  },
  {
    id: 'level_10',
    name: 'Knowledge Master',
    description: 'Reach level 10',
    icon: '🏆',
    unlockedAt: null,
    requirement: (d) => d.level >= 10,
  },
  {
    id: 'sessions_10',
    name: 'Regular',
    description: 'Complete 10 sessions',
    icon: '📅',
    unlockedAt: null,
    requirement: (d) => d.sessions.length >= 10,
  },
];

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.4, level - 1));
}

export function getLevel(totalXp: number): { level: number; currentXp: number; xpNeeded: number } {
  let level = 1;
  let remaining = totalXp;
  while (remaining >= xpForLevel(level)) {
    remaining -= xpForLevel(level);
    level++;
  }
  return { level, currentXp: remaining, xpNeeded: xpForLevel(level) };
}

// --- localStorage (offline / fallback) ---

export function loadStudyData(): StudyData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_DATA, ...JSON.parse(raw) };
    }
  } catch {}
  return { ...DEFAULT_DATA };
}

export function saveStudyData(data: StudyData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

// --- API-backed (authenticated) ---

function apiStatsToStudyData(stats: UserStats): StudyData {
  return {
    sessions: [],
    currentStreak: stats.current_streak,
    longestStreak: stats.longest_streak,
    totalXp: stats.total_xp,
    level: stats.level,
    lastStudyDate: stats.last_study_date,
    unlockedAchievements: stats.unlocked_achievements,
    totalMessages: stats.total_messages,
    totalStudyMinutes: stats.total_study_minutes,
    weeklyGoalMinutes: stats.weekly_goal_minutes,
  };
}

function studyDataToApiStats(data: StudyData): UserStats {
  return {
    current_streak: data.currentStreak,
    longest_streak: data.longestStreak,
    total_xp: data.totalXp,
    level: data.level,
    last_study_date: data.lastStudyDate,
    total_messages: data.totalMessages,
    total_study_minutes: data.totalStudyMinutes,
    weekly_goal_minutes: data.weeklyGoalMinutes,
    unlocked_achievements: data.unlockedAchievements,
  };
}

export async function loadStudyDataFromApi(): Promise<StudyData> {
  try {
    const stats = await fetchUserStats();
    const data = apiStatsToStudyData(stats);
    saveStudyData(data);
    return data;
  } catch {
    return loadStudyData();
  }
}

export async function saveStudyDataToApi(data: StudyData): Promise<void> {
  saveStudyData(data);
  try {
    await saveUserStatsApi(studyDataToApiStats(data));
  } catch {}
}

// --- Streak / session logic (unchanged) ---

export function updateStreak(data: StudyData): StudyData {
  const today = getToday();
  const yesterday = getYesterday();

  if (data.lastStudyDate === today) {
    return data;
  }

  if (data.lastStudyDate === yesterday) {
    data.currentStreak += 1;
  } else if (data.lastStudyDate !== today) {
    data.currentStreak = 1;
  }

  data.lastStudyDate = today;
  data.longestStreak = Math.max(data.longestStreak, data.currentStreak);
  return data;
}

export function recordSession(
  data: StudyData,
  session: Omit<StudySession, 'id' | 'xpEarned'>,
): { data: StudyData; xpEarned: number; newAchievements: Achievement[] } {
  let xp = 0;
  xp += Math.floor(session.durationMinutes * 2);
  xp += session.messageCount * 3;
  xp += session.topicsCovered.length * 10;
  if (data.currentStreak >= 3) xp = Math.floor(xp * 1.2);
  if (data.currentStreak >= 7) xp = Math.floor(xp * 1.5);
  xp = Math.max(xp, 10);

  const fullSession: StudySession = {
    ...session,
    id: `s_${Date.now()}`,
    xpEarned: xp,
  };

  data.sessions.push(fullSession);
  data.totalXp += xp;
  data.totalMessages += session.messageCount;
  data.totalStudyMinutes += session.durationMinutes;

  const levelInfo = getLevel(data.totalXp);
  data.level = levelInfo.level;

  data = updateStreak(data);

  const newAchievements: Achievement[] = [];
  for (const achievement of ACHIEVEMENTS) {
    if (!data.unlockedAchievements.includes(achievement.id) && achievement.requirement(data)) {
      data.unlockedAchievements.push(achievement.id);
      newAchievements.push({ ...achievement, unlockedAt: new Date().toISOString() });
    }
  }

  saveStudyData(data);
  return { data, xpEarned: xp, newAchievements };
}

export function getWeeklyStudyMinutes(data: StudyData): number[] {
  const result: number[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayMinutes = data.sessions
      .filter((s) => s.date === dateStr)
      .reduce((sum, s) => sum + s.durationMinutes, 0);
    result.push(dayMinutes);
  }
  return result;
}

export function getRecentTopics(data: StudyData, limit = 10): string[] {
  const topics: string[] = [];
  for (let i = data.sessions.length - 1; i >= 0 && topics.length < limit; i--) {
    for (const t of data.sessions[i].topicsCovered) {
      if (!topics.includes(t)) topics.push(t);
    }
  }
  return topics;
}
