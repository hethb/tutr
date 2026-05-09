const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('tutr_jwt');
  if (token) return { Authorization: `Bearer ${token}` };
  return {};
}

export interface Course {
  id: string;
  name: string;
  department: string;
  topics: string[];
  custom?: boolean;
  university?: string;
  courseNumber?: string;
}

export interface UploadResult {
  filename: string;
  status: string;
  chunks?: number;
  message?: string;
}

export async function fetchCourses(department?: string): Promise<Course[]> {
  const url = department
    ? `${API_BASE}/courses?department=${encodeURIComponent(department)}`
    : `${API_BASE}/courses`;
  const res = await fetch(url);
  const data = await res.json();
  return data.courses;
}

export async function fetchDepartments(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/departments`);
  const data = await res.json();
  return data.departments;
}

export async function uploadFiles(files: File[], sessionId: string): Promise<UploadResult[]> {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  formData.append('session_id', sessionId);

  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });
  const data = await res.json();
  return data.results;
}

export async function sendChat(
  message: string,
  sessionId: string,
  conversationHistory: { role: string; content: string }[],
  courseContext?: string,
): Promise<string> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({
      message,
      session_id: sessionId,
      conversation_history: conversationHistory,
      course_context: courseContext,
    }),
  });
  const data = await res.json();
  return data.response;
}

export async function streamChat(
  message: string,
  sessionId: string,
  conversationHistory: { role: string; content: string }[],
  courseContext?: string,
  onChunk?: (text: string) => void,
): Promise<string> {
  const res = await fetch(`${API_BASE}/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({
      message,
      session_id: sessionId,
      conversation_history: conversationHistory,
      course_context: courseContext,
    }),
  });

  const reader = res.body?.getReader();
  const decoder = new TextDecoder();
  let fullText = '';

  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              fullText += parsed.text;
              onChunk?.(parsed.text);
            }
          } catch {}
        }
      }
    }
  }

  return fullText;
}

export function createWebSocket(sessionId: string): WebSocket {
  const apiUrl = import.meta.env.VITE_API_URL || '';
  if (apiUrl) {
    const wsUrl = apiUrl.replace(/^http/, 'ws');
    return new WebSocket(`${wsUrl}/api/ws/${sessionId}`);
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  return new WebSocket(`${protocol}//${host}/api/ws/${sessionId}`);
}

// --- User data endpoints ---

export interface UserStats {
  current_streak: number;
  longest_streak: number;
  total_xp: number;
  level: number;
  last_study_date: string | null;
  total_messages: number;
  total_study_minutes: number;
  weekly_goal_minutes: number;
  unlocked_achievements: string[];
}

export interface SessionRecord {
  id: number;
  date: string;
  start_time: number;
  end_time: number;
  duration_minutes: number;
  course: string | null;
  message_count: number;
  xp_earned: number;
  created_at: string;
}

export interface SessionDetail extends SessionRecord {
  messages: { role: string; content: string }[];
}

export async function fetchUserStats(): Promise<UserStats> {
  const res = await fetch(`${API_BASE}/user/stats`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch stats');
  const data = await res.json();
  return data.stats;
}

export async function saveUserStats(stats: UserStats): Promise<void> {
  const res = await fetch(`${API_BASE}/user/stats`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(stats),
  });
  if (!res.ok) throw new Error('Failed to save stats');
}

export async function fetchSessionHistory(limit = 50, offset = 0): Promise<SessionRecord[]> {
  const res = await fetch(`${API_BASE}/user/sessions?limit=${limit}&offset=${offset}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch sessions');
  const data = await res.json();
  return data.sessions;
}

export async function fetchSessionDetail(sessionId: number): Promise<SessionDetail> {
  const res = await fetch(`${API_BASE}/user/sessions/${sessionId}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch session detail');
  const data = await res.json();
  return data.session;
}

export async function saveSession(session: {
  date: string;
  start_time: number;
  end_time: number;
  duration_minutes: number;
  course?: string | null;
  message_count: number;
  xp_earned: number;
  messages: { role: string; content: string }[];
}): Promise<number> {
  const res = await fetch(`${API_BASE}/user/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(session),
  });
  if (!res.ok) throw new Error('Failed to save session');
  const data = await res.json();
  return data.session_id;
}
