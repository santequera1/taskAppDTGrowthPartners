import React from 'react';
import { PomodoroSession } from '../types';

interface Props {
  sessions?: PomodoroSession[];
}

const PomodoroHistory: React.FC<Props> = ({ sessions }) => {
  if (!sessions || sessions.length === 0) return <div className="text-xs text-slate-400">No hay sesiones</div>;

  return (
    <div className="space-y-2 max-h-40 overflow-y-auto text-xs">
      {sessions.slice().reverse().map(s => (
        <div key={s.id} className="flex items-center justify-between bg-slate-900/30 p-2 rounded">
          <div>
            <div className="text-slate-200">{s.date} - {new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            <div className="text-slate-400">{Math.round(s.duration / 60000)} min • {s.type === 'work' ? '✓' : 'break'}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PomodoroHistory;
