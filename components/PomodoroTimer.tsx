import React, { useEffect, useRef, useState } from 'react';
import PomodoroControls from './PomodoroControls';
import { formatSeconds, msToSeconds, secondsToMs, generateId } from '../utils/pomodoroHelpers';
import { playPomodoroSound, showPomodoroNotification } from '../utils/pomodoroSound';
import { PomodoroSession } from '../types';

interface PomodoroTimerProps {
  taskId: string;
  initialTimeMs?: number; // ms remaining
  initialStatus?: 'idle' | 'running' | 'paused' | 'break';
  workDurationMs?: number; // ms for work (default 25min)
  onComplete?: (taskId: string, session: PomodoroSession) => void;
  onUpdate?: (taskId: string, state: { pomodoroStatus?: string; currentPomodoroTime?: number | null }) => void;
  compact?: boolean; // render compact UI (time + single toggle)
}

const DEFAULT_WORK_MS = 25 * 60 * 1000;

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ taskId, initialTimeMs, initialStatus = 'idle', workDurationMs = DEFAULT_WORK_MS, onComplete, onUpdate, compact = false }) => {
  const [status, setStatus] = useState(initialStatus);
  const [timeLeftMs, setTimeLeftMs] = useState<number>(initialTimeMs ?? workDurationMs);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    // keep props in sync if changed externally
    setStatus(initialStatus);
    if (initialTimeMs !== undefined) setTimeLeftMs(initialTimeMs);
  }, [initialStatus, initialTimeMs]);

  useEffect(() => {
    // ensure interval is created when running
    if (status === 'running') {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      intervalRef.current = window.setInterval(() => {
        setTimeLeftMs(prev => {
          if (prev <= 1000) {
            // complete
            window.clearInterval(intervalRef.current!);
            intervalRef.current = null;
            handleComplete();
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    // notify parent of updates
    if (onUpdate) onUpdate(taskId, { pomodoroStatus: status, currentPomodoroTime: timeLeftMs });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeftMs, status]);

  const handleStart = () => {
    setStatus('running');
    if (onUpdate) onUpdate(taskId, { pomodoroStatus: 'running', currentPomodoroTime: timeLeftMs });
  };

  const handlePause = () => {
    setStatus('paused');
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (onUpdate) onUpdate(taskId, { pomodoroStatus: 'paused', currentPomodoroTime: timeLeftMs });
  };

  // Reset is available internally (used by complete) but not exposed as a button by default.
  const handleReset = () => {
    setStatus('idle');
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setTimeLeftMs(workDurationMs);
    if (onUpdate) onUpdate(taskId, { pomodoroStatus: 'idle', currentPomodoroTime: null });
  };

  const handleToggle = () => {
    if (status === 'running') {
      handlePause();
    } else {
      handleStart();
    }
  };

  const handleComplete = () => {
    // reset timer UI/state
    handleReset();
    playPomodoroSound();
    showPomodoroNotification('Tarea completada');

    const now = Date.now();
    const session: PomodoroSession = {
      id: generateId(),
      taskId,
      startTime: now - workDurationMs,
      endTime: now,
      duration: workDurationMs,
      completed: true,
      type: 'work',
      date: new Date(now).toISOString().split('T')[0],
    };

    if (onComplete) onComplete(taskId, session);
  };

  const secondsLeft = Math.ceil(timeLeftMs / 1000);

  if (compact) {
    return (
      <div className={`pomodoro-timer flex items-center gap-2 p-0 rounded-md ${status === 'running' ? 'running' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="text-sm font-mono tabular-nums text-white leading-none w-16 text-right"> <span className="ml-1">{formatSeconds(secondsLeft)}</span></div>
        <PomodoroControls isRunning={status === 'running'} onToggle={handleToggle} />
      </div>
    );
  }

  return (
    <div className={`pomodoro-timer flex items-center gap-3 p-2 rounded-md ${status === 'running' ? 'running' : ''}`} onClick={(e) => e.stopPropagation()}>
      <div className="text-sm font-mono tabular-nums text-white leading-none w-16 text-center">{formatSeconds(secondsLeft)}</div>
      <PomodoroControls isRunning={status === 'running'} onToggle={handleToggle} />
    </div>
  );
};

export default PomodoroTimer;
