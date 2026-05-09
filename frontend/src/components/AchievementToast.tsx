import { useEffect, useState } from 'react';
import { Achievement } from '../services/studyData';

interface AchievementToastProps {
  achievement: Achievement | null;
  onDismiss: () => void;
}

export default function AchievementToast({ achievement, onDismiss }: AchievementToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (achievement) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onDismiss, 500);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [achievement, onDismiss]);

  if (!achievement) return null;

  return (
    <div
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}
    >
      <div className="glass rounded-2xl px-6 py-4 flex items-center gap-4 shadow-2xl shadow-tutr-accent/20 border border-tutr-accent/30">
        <div className="text-3xl">{achievement.icon}</div>
        <div>
          <p className="text-xs text-tutr-accent font-medium uppercase tracking-wider">Achievement Unlocked</p>
          <p className="text-sm font-bold mt-0.5">{achievement.name}</p>
          <p className="text-xs text-gray-400">{achievement.description}</p>
        </div>
      </div>
    </div>
  );
}
