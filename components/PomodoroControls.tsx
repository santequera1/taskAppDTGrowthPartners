import React from 'react';
import { Play, Pause, Square } from 'lucide-react';

interface PomodoroControlsProps {
  isRunning: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
}

const PomodoroControls: React.FC<PomodoroControlsProps> = ({ isRunning, onStart, onPause, onReset }) => {
  return (
    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
      {isRunning ? (
        <button onClick={(e) => { e.stopPropagation(); onPause(); }} title="Pause" className="pomodoro-btn bg-slate-800 text-white p-2 rounded-md">
          <Pause size={14} />
        </button>
      ) : (
        <button onClick={(e) => { e.stopPropagation(); onStart(); }} title="Start" className="pomodoro-btn bg-green-600 text-white p-2 rounded-md">
          <Play size={14} />
        </button>
      )}

      <button onClick={(e) => { e.stopPropagation(); onReset(); }} title="Reset" className="pomodoro-btn bg-red-600 text-white p-2 rounded-md">
        <Square size={14} />
      </button>
    </div>
  );
};

export default PomodoroControls;
