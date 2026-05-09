import { VideoOff } from 'lucide-react';

interface UserVideoProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isActive: boolean;
  isScreenShare?: boolean;
  label?: string;
}

export default function UserVideo({ videoRef, isActive, isScreenShare, label }: UserVideoProps) {
  return (
    <div className={`relative overflow-hidden rounded-2xl h-full ${isScreenShare ? 'bg-tutr-darker' : 'bg-tutr-surface'}`}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover ${!isScreenShare ? 'mirror' : ''} ${!isActive ? 'hidden' : ''}`}
        style={!isScreenShare ? { transform: 'scaleX(-1)' } : undefined}
      />
      {!isActive && (
        <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-4">
          <div className="w-16 h-16 rounded-full bg-tutr-surface-light flex items-center justify-center">
            <VideoOff size={24} className="text-gray-500" />
          </div>
          <span className="text-sm text-gray-500">
            {isScreenShare ? 'Screen share inactive' : 'Camera off'}
          </span>
        </div>
      )}
      {label && (
        <div className="absolute bottom-2 left-2 glass-light px-3 py-1 rounded-lg">
          <span className="text-xs font-medium">{label}</span>
        </div>
      )}
    </div>
  );
}
