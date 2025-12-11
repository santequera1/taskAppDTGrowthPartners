import React, { useState } from 'react';
import { TaskStatus } from '../types';
import { ChevronDown } from 'lucide-react';

interface StatusSelectorProps {
  currentStatus: TaskStatus;
  onStatusChange: (newStatus: TaskStatus) => void;
  size?: 'sm' | 'md';
}

const StatusSelector: React.FC<StatusSelectorProps> = ({
  currentStatus,
  onStatusChange,
  size = 'sm'
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const statusConfig = {
    [TaskStatus.TODO]: {
      label: 'Pendiente',
      color: 'bg-slate-500',
      hoverColor: 'hover:bg-slate-600'
    },
    [TaskStatus.IN_PROGRESS]: {
      label: 'En curso',
      color: 'bg-amber-500',
      hoverColor: 'hover:bg-amber-600'
    },
    [TaskStatus.DONE]: {
      label: 'Terminado',
      color: 'bg-emerald-500',
      hoverColor: 'hover:bg-emerald-600'
    }
  };

  const currentConfig = statusConfig[currentStatus];

  const handleStatusSelect = (status: TaskStatus) => {
    onStatusChange(status);
    setIsOpen(false);
  };

  const sizeClasses = size === 'sm'
    ? 'px-2 py-0.5 text-xs'
    : 'px-3 py-1 text-sm';

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-1.5 ${sizeClasses} rounded-full text-white font-medium transition-colors ${currentConfig.color} ${currentConfig.hoverColor}`}
      >
        <span>{currentConfig.label}</span>
        <ChevronDown size={size === 'sm' ? 10 : 12} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-1 z-20 bg-slate-800 border border-slate-700 rounded-lg shadow-lg py-1 min-w-32">
            {Object.entries(statusConfig).map(([status, config]) => (
              <button
                key={status}
                onClick={() => handleStatusSelect(status as TaskStatus)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-700 transition-colors flex items-center gap-2 ${
                  status === currentStatus ? 'bg-slate-700 text-white' : 'text-slate-300'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${config.color}`} />
                <span>{config.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default StatusSelector;