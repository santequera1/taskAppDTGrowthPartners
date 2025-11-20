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
}

const DEFAULT_WORK_MS = 25 * 60 * 1000;

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ taskId, initialTimeMs, initialStatus = 'idle', workDurationMs = DEFAULT_WORK_MS, onComplete, onUpdate }) => {
  const [status, setStatus] = useState(initialStatus);
  const [timeLeftMs, setTimeLeftMs] = useState<number>(initialTimeMs ?? workDurationMs);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    // keep props in sync if changed externally
    setStatus(initialStatus);
    if (initialTimeMs !== undefined) setTimeLeftMs(initialTimeMs);
  }, [initialStatus, initialTimeMs]);

  useEffect(() => {
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

  const handleReset = () => {
    setStatus('idle');
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setTimeLeftMs(workDurationMs);
    if (onUpdate) onUpdate(taskId, { pomodoroStatus: 'idle', currentPomodoroTime: null });
  };

  const handleComplete = () => {
    setStatus('idle');
    setTimeLeftMs(workDurationMs);
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
    if (onUpdate) onUpdate(taskId, { pomodoroStatus: 'idle', currentPomodoroTime: null });
  };

  const secondsLeft = Math.ceil(timeLeftMs / 1000);

  return (
    <div className={`pomodoro-timer flex items-center gap-3 p-2 rounded-md ${status === 'running' ? 'running' : ''}`} onClick={(e) => e.stopPropagation()}>
      <div className="text-sm font-mono text-white">{formatSeconds(secondsLeft)}</div>
      <PomodoroControls isRunning={status === 'running'} onStart={handleStart} onPause={handlePause} onReset={handleReset} />
    </div>
  );
};

export default PomodoroTimer;
