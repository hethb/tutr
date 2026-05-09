import {
  Mic, MicOff, Video, VideoOff, Monitor, MonitorOff,
  PhoneOff, MessageSquare, Upload, PanelRightOpen, PanelRightClose,
  Volume2, VolumeX,
} from 'lucide-react';
import clsx from 'clsx';

interface ControlsProps {
  isMicOn: boolean;
  isCameraOn: boolean;
  isScreenSharing: boolean;
  isSidebarOpen: boolean;
  isMuted: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onToggleSidebar: () => void;
  onToggleMute: () => void;
  onEndCall: () => void;
}

export default function Controls({
  isMicOn, isCameraOn, isScreenSharing, isSidebarOpen, isMuted,
  onToggleMic, onToggleCamera, onToggleScreenShare,
  onToggleSidebar, onToggleMute, onEndCall,
}: ControlsProps) {
  const buttons = [
    {
      icon: isMicOn ? Mic : MicOff,
      label: isMicOn ? 'Mute' : 'Unmute',
      onClick: onToggleMic,
      active: isMicOn,
      danger: false,
    },
    {
      icon: isCameraOn ? Video : VideoOff,
      label: isCameraOn ? 'Stop Camera' : 'Start Camera',
      onClick: onToggleCamera,
      active: isCameraOn,
      danger: false,
    },
    {
      icon: isScreenSharing ? MonitorOff : Monitor,
      label: isScreenSharing ? 'Stop Sharing' : 'Share Screen',
      onClick: onToggleScreenShare,
      active: isScreenSharing,
      accent: isScreenSharing,
      danger: false,
    },
    {
      icon: isMuted ? VolumeX : Volume2,
      label: isMuted ? 'Unmute Tutor' : 'Mute Tutor',
      onClick: onToggleMute,
      active: !isMuted,
      danger: false,
    },
    {
      icon: isSidebarOpen ? PanelRightClose : PanelRightOpen,
      label: isSidebarOpen ? 'Close Panel' : 'Open Panel',
      onClick: onToggleSidebar,
      active: isSidebarOpen,
      danger: false,
    },
  ];

  return (
    <div className="flex items-center justify-center gap-3 py-4 px-6">
      {buttons.map((btn) => {
        const Icon = btn.icon;
        return (
          <button
            key={btn.label}
            onClick={btn.onClick}
            className={clsx(
              'group relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200',
              btn.active
                ? btn.accent
                  ? 'bg-tutr-accent text-white hover:bg-tutr-accent/80'
                  : 'bg-tutr-surface-light text-white hover:bg-tutr-surface'
                : 'bg-tutr-surface text-gray-400 hover:bg-tutr-surface-light hover:text-white',
            )}
            title={btn.label}
          >
            <Icon size={20} />
            <span className="absolute -bottom-8 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {btn.label}
            </span>
          </button>
        );
      })}

      <div className="w-px h-8 bg-gray-700 mx-2" />

      <button
        onClick={onEndCall}
        className="flex items-center justify-center w-14 h-12 rounded-full bg-red-600 text-white hover:bg-red-700 transition-all duration-200"
        title="End Session"
      >
        <PhoneOff size={20} />
      </button>
    </div>
  );
}
