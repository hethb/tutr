import { useState, useCallback, useEffect, useRef } from 'react';
import clsx from 'clsx';
import { Clock, Flame, Zap } from 'lucide-react';
import TutorAvatar from './TutorAvatar';
import UserVideo from './UserVideo';
import Controls from './Controls';
import ChatPanel from './ChatPanel';
import Sidebar from './Sidebar';
import StudyStats from './StudyStats';
import AchievementToast from './AchievementToast';
import { useWebcam } from '../hooks/useWebcam';
import { useScreenShare } from '../hooks/useScreenShare';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { streamChat, Course, UploadResult, saveSession } from '../services/api';
import {
  StudyData, loadStudyData, saveStudyData, saveStudyDataToApi, recordSession,
  updateStreak, getLevel, Achievement,
} from '../services/studyData';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface CallInterfaceProps {
  sessionId: string;
  selectedCourse: Course | null;
  onSelectCourse: (course: Course | null) => void;
  uploadedChunks: number;
  onUploadComplete: (results: UploadResult[]) => void;
  onEndCall: (summary: {
    durationMinutes: number;
    messageCount: number;
    xpEarned: number;
    newAchievements: Achievement[];
    studyData: StudyData;
  }) => void;
  userName: string;
}

const STUCK_TIMEOUT_MS = 180_000;
const STUCK_MESSAGES = [
  "Hey, you've been quiet for a bit — everything okay? Need help with anything?",
  "Still there? No worries if you're thinking, but I'm here whenever you need me.",
  "I notice you've been working for a while without asking anything. Want to talk through what you're looking at?",
  "Take your time, but just checking in — stuck on something? I'm happy to help.",
  "Hey! Looks like you might be stuck. Want to walk me through what you're working on?",
];

export default function CallInterface({
  sessionId, selectedCourse, onSelectCourse,
  uploadedChunks, onUploadComplete, onEndCall, userName,
}: CallInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStreamText, setCurrentStreamText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [studyData, setStudyData] = useState<StudyData>(loadStudyData());
  const [achievementToast, setAchievementToast] = useState<Achievement | null>(null);

  const sessionStartRef = useRef(Date.now());
  const messageCountRef = useRef(0);
  const lastActivityRef = useRef(Date.now());
  const stuckCheckedRef = useRef(false);

  const webcam = useWebcam();
  const screenShare = useScreenShare();
  const speech = useSpeechRecognition();
  const audio = useAudioPlayer();

  const levelInfo = getLevel(studyData.totalXp);

  // Call timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCallDuration((d) => d + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Stuck timer — checks every 30s, fires if no activity for 3 min
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      if (elapsed >= STUCK_TIMEOUT_MS && !stuckCheckedRef.current && messages.length > 0) {
        stuckCheckedRef.current = true;
        const msg = STUCK_MESSAGES[Math.floor(Math.random() * STUCK_MESSAGES.length)];
        const checkinMessage: Message = {
          role: 'assistant',
          content: msg,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, checkinMessage]);
        if (!isMuted) {
          audio.speak(msg);
        }
      }
    }, 30_000);
    return () => clearInterval(interval);
  }, [messages.length, isMuted, audio]);

  // Mark streak on session start
  useEffect(() => {
    const updated = updateStreak({ ...studyData });
    setStudyData(updated);
    saveStudyData(updated);
  }, []);

  const resetStuckTimer = () => {
    lastActivityRef.current = Date.now();
    stuckCheckedRef.current = false;
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleEndCall = () => {
    const durationMinutes = Math.max(1, Math.round((Date.now() - sessionStartRef.current) / 60000));
    const courseName = selectedCourse?.custom
      ? `${selectedCourse.university || ''} ${selectedCourse.courseNumber || ''}`.trim()
      : selectedCourse?.name || null;

    const { data, xpEarned, newAchievements } = recordSession(studyData, {
      date: new Date().toISOString().split('T')[0],
      startTime: sessionStartRef.current,
      endTime: Date.now(),
      durationMinutes,
      course: courseName,
      topicsCovered: [],
      messageCount: messageCountRef.current,
    });

    saveStudyDataToApi(data).catch(() => {});

    const transcript = messages.map((m) => ({ role: m.role, content: m.content }));
    saveSession({
      date: new Date().toISOString().split('T')[0],
      start_time: sessionStartRef.current,
      end_time: Date.now(),
      duration_minutes: durationMinutes,
      course: courseName,
      message_count: messageCountRef.current,
      xp_earned: xpEarned,
      messages: transcript,
    }).catch(() => {});

    onEndCall({ durationMinutes, messageCount: messageCountRef.current, xpEarned, newAchievements, studyData: data });
  };

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isThinking) return;
    resetStuckTimer();
    messageCountRef.current += 1;

    const userMessage: Message = {
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsThinking(true);
    setCurrentStreamText('');

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      let courseContext: string | undefined;
      if (selectedCourse?.custom) {
        const parts = [selectedCourse.university, selectedCourse.courseNumber, selectedCourse.name].filter(Boolean);
        courseContext = parts.join(' — ');
      } else if (selectedCourse) {
        courseContext = `${selectedCourse.name} (${selectedCourse.department}) - Topics: ${selectedCourse.topics.join(', ')}`;
      }

      let fullResponse = '';
      await streamChat(
        text.trim(),
        sessionId,
        history,
        courseContext,
        (chunk) => {
          fullResponse += chunk;
          setCurrentStreamText(fullResponse);
        },
      );

      const assistantMessage: Message = {
        role: 'assistant',
        content: fullResponse,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setCurrentStreamText('');
      resetStuckTimer();

      if (!isMuted && fullResponse) {
        audio.speak(fullResponse);
      }
    } catch (err) {
      console.error('Chat error:', err);
      const errorMessage: Message = {
        role: 'assistant',
        content: "Sorry, I'm having trouble connecting right now. Make sure the backend server is running and your API key is configured.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setCurrentStreamText('');
    } finally {
      setIsThinking(false);
    }
  }, [messages, sessionId, selectedCourse, isThinking, isMuted, audio]);

  return (
    <div className="h-screen flex flex-col bg-tutr-darker">
      <AchievementToast achievement={achievementToast} onDismiss={() => setAchievementToast(null)} />

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 glass border-b border-gray-800/50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-medium text-gray-400">LIVE</span>
          </div>
          <div className="w-px h-4 bg-gray-700" />
          <div className="flex items-center gap-1.5 text-gray-400">
            <Clock size={12} />
            <span className="text-xs font-mono">{formatDuration(callDuration)}</span>
          </div>
        </div>

        <h2 className="text-sm font-semibold">
          <span className="bg-gradient-to-r from-tutr-accent to-tutr-accent-light bg-clip-text text-transparent">
            Tutr
          </span>
          <span className="text-gray-500 ml-2 font-normal">Session with Alex</span>
        </h2>

        <div className="flex items-center gap-3">
          {/* Streak + Level */}
          <div className="flex items-center gap-2">
            {studyData.currentStreak > 0 && (
              <div className="flex items-center gap-1" title={`${studyData.currentStreak}-day streak`}>
                <Flame size={13} className="text-orange-400" />
                <span className="text-[10px] font-bold text-orange-400">{studyData.currentStreak}</span>
              </div>
            )}
            <div className="flex items-center gap-1" title={`Level ${levelInfo.level}`}>
              <Zap size={13} className="text-yellow-400" />
              <span className="text-[10px] font-bold text-yellow-400">Lv.{levelInfo.level}</span>
            </div>
          </div>

          <div className="w-px h-4 bg-gray-700" />

          {selectedCourse && (
            <span className="text-[10px] px-2 py-1 rounded-full bg-tutr-accent/10 text-tutr-accent-light">
              {selectedCourse.custom
                ? `${selectedCourse.university || ''} ${selectedCourse.courseNumber || ''}`.trim()
                : selectedCourse.id.toUpperCase()}
            </span>
          )}
          {uploadedChunks > 0 && (
            <span className="text-[10px] px-2 py-1 rounded-full bg-tutr-success/10 text-tutr-success">
              {uploadedChunks} docs
            </span>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 flex items-center justify-center relative p-6">
            {/* Tutor main view */}
            <div className="flex flex-col items-center">
              <TutorAvatar
                isSpeaking={audio.isSpeaking}
                volume={audio.volume}
                isThinking={isThinking}
              />
              <div className="mt-4 text-center">
                <h3 className="text-lg font-semibold">Alex</h3>
                <p className="text-xs text-gray-500">AI Tutor</p>
              </div>
            </div>

            {/* User webcam (picture-in-picture) */}
            <div className="absolute bottom-4 right-4 w-48 h-36 rounded-2xl overflow-hidden shadow-2xl border-2 border-gray-800">
              <UserVideo
                videoRef={webcam.videoRef}
                isActive={webcam.isActive}
                label={userName || 'You'}
              />
            </div>

            {/* Screen share overlay */}
            {screenShare.isSharing && (
              <div className="absolute inset-4 rounded-2xl overflow-hidden shadow-2xl border border-gray-700 bg-black">
                <UserVideo
                  videoRef={screenShare.videoRef}
                  isActive={screenShare.isSharing}
                  isScreenShare
                  label="Your Screen"
                />
                <div className="absolute top-4 right-4 w-32 h-32">
                  <TutorAvatar
                    isSpeaking={audio.isSpeaking}
                    volume={audio.volume}
                    isThinking={isThinking}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="glass border-t border-gray-800/50">
            <Controls
              isMicOn={speech.isListening}
              isCameraOn={webcam.isActive}
              isScreenSharing={screenShare.isSharing}
              isSidebarOpen={isSidebarOpen}
              isMuted={isMuted}
              onToggleMic={speech.toggle}
              onToggleCamera={webcam.toggle}
              onToggleScreenShare={screenShare.toggle}
              onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
              onToggleMute={() => {
                setIsMuted(!isMuted);
                if (!isMuted) audio.stop();
              }}
              onEndCall={handleEndCall}
            />
          </div>
        </div>

        {/* Chat panel */}
        <div
          className={clsx(
            'border-l border-gray-800 bg-tutr-dark transition-all duration-300',
            isChatOpen ? 'w-96' : 'w-0 overflow-hidden',
          )}
        >
          <ChatPanel
            messages={messages}
            currentStreamText={currentStreamText}
            isThinking={isThinking}
            onSendMessage={sendMessage}
            isListening={speech.isListening}
            transcript={speech.transcript}
            interimTranscript={speech.interimTranscript}
            onToggleListening={speech.toggle}
            speechSupported={speech.isSupported}
          />
        </div>

        {/* Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          sessionId={sessionId}
          selectedCourse={selectedCourse}
          onSelectCourse={onSelectCourse}
          uploadedCount={uploadedChunks}
          onUploadComplete={onUploadComplete}
        />
      </div>
    </div>
  );
}
