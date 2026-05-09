import { useState } from 'react';
import { FileText, BookOpen, Settings, X, Users } from 'lucide-react';
import clsx from 'clsx';
import FileUpload from './FileUpload';
import CourseSelector from './CourseSelector';
import ParticipantList, { Participant } from './ParticipantList';
import { Course, UploadResult } from '../services/api';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  selectedCourse: Course | null;
  onSelectCourse: (course: Course | null) => void;
  uploadedCount: number;
  onUploadComplete: (results: UploadResult[]) => void;
}

type Tab = 'materials' | 'course' | 'people' | 'settings';

export default function Sidebar({
  isOpen, onClose, sessionId,
  selectedCourse, onSelectCourse,
  uploadedCount, onUploadComplete,
}: SidebarProps) {
  const [activeTab, setActiveTab] = useState<Tab>('materials');

  const participants: Participant[] = [
    { id: 'you', name: 'You', isYou: true },
  ];

  const tabs: { id: Tab; label: string; icon: typeof FileText }[] = [
    { id: 'materials', label: 'Files', icon: FileText },
    { id: 'course', label: 'Course', icon: BookOpen },
    { id: 'people', label: 'People', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div
      className={clsx(
        'h-full bg-tutr-dark border-l border-gray-800 transition-all duration-300 flex flex-col',
        isOpen ? 'w-80' : 'w-0 overflow-hidden',
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all',
                  activeTab === tab.id
                    ? 'bg-tutr-accent text-white'
                    : 'text-gray-400 hover:text-white hover:bg-tutr-surface-light',
                )}
              >
                <Icon size={13} />
                {tab.label}
              </button>
            );
          })}
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'materials' && (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-1">Upload Study Materials</h4>
              <p className="text-xs text-gray-500 mb-3">
                Upload your lecture notes, textbooks, or assignments. Alex will use them to help you.
              </p>
              <FileUpload sessionId={sessionId} onUploadComplete={onUploadComplete} />
            </div>

            {uploadedCount > 0 && (
              <div className="glass-light rounded-xl p-3">
                <p className="text-xs text-tutr-success">
                  {uploadedCount} document chunk{uploadedCount !== 1 ? 's' : ''} indexed and ready
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'course' && (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-1">Course Context</h4>
              <p className="text-xs text-gray-500 mb-3">
                Select your course so Alex can tailor help to your curriculum.
              </p>
              <CourseSelector
                selectedCourse={selectedCourse}
                onSelectCourse={onSelectCourse}
              />
            </div>

            {selectedCourse && selectedCourse.topics.length > 0 && (
              <div className="glass-light rounded-xl p-3 space-y-2">
                <h5 className="text-xs font-medium text-tutr-accent">{selectedCourse.name}</h5>
                <div className="flex flex-wrap gap-1">
                  {selectedCourse.topics.map((topic) => (
                    <span
                      key={topic}
                      className="px-2 py-0.5 bg-tutr-darker rounded text-[10px] text-gray-400"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'people' && (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-1">Participants</h4>
              <p className="text-xs text-gray-500 mb-3">
                Invite classmates to join this study session.
              </p>
              <ParticipantList
                participants={participants}
                sessionId={sessionId}
                onInvite={() => {}}
              />
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-3">Session Settings</h4>
              <div className="space-y-3">
                <div className="glass-light rounded-xl p-3">
                  <p className="text-xs font-medium mb-1">Session ID</p>
                  <p className="text-[10px] text-gray-500 font-mono break-all">{sessionId}</p>
                </div>
                <div className="glass-light rounded-xl p-3">
                  <p className="text-xs font-medium mb-1">Tutor</p>
                  <p className="text-[10px] text-gray-500">Alex — AI Study Partner</p>
                </div>
                <div className="glass-light rounded-xl p-3">
                  <p className="text-xs font-medium mb-1">Voice</p>
                  <p className="text-[10px] text-gray-500">Browser SpeechSynthesis (free)</p>
                </div>
                <div className="glass-light rounded-xl p-3">
                  <p className="text-xs font-medium mb-1">LLM</p>
                  <p className="text-[10px] text-gray-500">Llama 3.3 70B via Groq (free)</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
