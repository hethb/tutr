import { Users, Crown, Circle } from 'lucide-react';

export interface Participant {
  id: string;
  name: string;
  isYou?: boolean;
}

interface ParticipantListProps {
  participants: Participant[];
  sessionId: string;
  onInvite: () => void;
}

export default function ParticipantList({ participants, sessionId, onInvite }: ParticipantListProps) {
  const copyLink = () => {
    const link = `${window.location.origin}?join=${sessionId}`;
    navigator.clipboard.writeText(link).catch(() => {});
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={14} className="text-tutr-accent" />
          <span className="text-xs font-medium">{participants.length + 1} in session</span>
        </div>
      </div>

      {/* Tutor */}
      <div className="flex items-center gap-3 glass-light rounded-xl p-2.5">
        <div className="w-8 h-8 rounded-full bg-tutr-accent/20 flex items-center justify-center">
          <Crown size={14} className="text-tutr-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium">Alex</p>
          <p className="text-[9px] text-gray-500">AI Tutor</p>
        </div>
        <Circle size={8} className="text-green-400 fill-green-400" />
      </div>

      {/* Participants */}
      {participants.map((p) => (
        <div key={p.id} className="flex items-center gap-3 glass-light rounded-xl p-2.5">
          <div className="w-8 h-8 rounded-full bg-tutr-surface-light flex items-center justify-center text-xs font-bold">
            {p.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium">
              {p.name} {p.isYou && <span className="text-gray-500">(you)</span>}
            </p>
          </div>
          <Circle size={8} className="text-green-400 fill-green-400" />
        </div>
      ))}

      {/* Invite */}
      <button
        onClick={copyLink}
        className="w-full py-2.5 border border-dashed border-gray-700 rounded-xl text-xs text-gray-400 hover:text-white hover:border-tutr-accent/50 transition-all"
      >
        Copy invite link
      </button>
    </div>
  );
}
