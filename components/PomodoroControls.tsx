import React from 'react';
import { Play, Pause } from 'lucide-react';

interface PomodoroControlsProps {
  isRunning: boolean;
  onToggle: () => void;
}

const PomodoroControls: React.FC<PomodoroControlsProps> = ({ isRunning, onToggle }) => {
  return (
    <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        title={isRunning ? 'Pausar' : 'Iniciar'}
        className={`p-1.5 rounded-lg transition-all hover:scale-110 ${isRunning ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}
      >
        {isRunning ? <Pause size={14} /> : <Play size={14} />}
      </button>
    </div>
  );
};

export default PomodoroControls;
